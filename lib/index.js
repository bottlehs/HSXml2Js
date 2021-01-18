/* eslint-disable no-useless-escape */
export function xmlParser(paramsXml, returnType) {
	// html escape
	String.prototype.escapeHtml = function() {
		return this.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/&;/g, '&amp;')
			.replace(/\[/g, '&#91;')
			.replace(/]/g, '&#93;')
			.replace(/"\"/g, '&quot;');
	};
	// html runescape
	String.prototype.unescapeHtml = function() {
		return this.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&#91;/g, '[')
			.replace(/&#93;/g, ']')
			.replace(/&quot;/g, '"');
	};

	// hsml tags
	const tags = [
		'button',
		'checkbox',
		'image',
		'input',
		'radiobutton',
		'select',
		'text',
		'bubble',
		'layout',
		'layout-table',
		'layout-list',
		'link',
		'info-list',
		'hsml',
		'layout-popup',
		'html',
	];

	var isButton = false; // button 유무
	var emotion = ''; // emotion 유무

	// br tag 오류 수정
	// 숫자키인 경우
	if (!isNaN(paramsXml)) {
		paramsXml = '확인';
	}
	var parserXml = paramsXml.replace(/<br>/g, '<br/>');
	parserXml = parserXml.replace(/&/g, '&amp;');
	paramsXml = '';

	// hsml 에 오류가 있을경우 일반 텍스트로 변환
	parserXml = isGeneralText(parserXml);

	if (returnType == 'xml') {
		return parserXml;
	}

	// xml 정의
	parserXml =
		'<?xml version="1.0" encoding="UTF-8"?>' + '<hsml>' + parserXml + '</hsml>';

	// javascript domParser
	var xmlDoc = domParser(parserXml, 'application/xml');

	function domParser(xml, mimeType = 'application/xml') {
		// javascript domParser
		if (window.DOMParser) {
			var parser = new DOMParser();
			xmlDoc = parser.parseFromString(xml, mimeType);
		} // 인터넷 익스플로러
		else {
			// eslint-disable-next-line no-undef
			xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
			xmlDoc.async = false;
			xmlDoc.loadXML(xml);
		}

		return xmlDoc;
	}

	function isGeneralText(parsedDocument) {
		// xml 에 오류가 있을경우 일반 텍스트로 변환
		var generalParse = domParser(parsedDocument, 'text/html');
		var checkHsml = false;

		if (
			isParseError(
				domParser('<hsml>' + parsedDocument + '</hsml>', 'application/xml'),
			)
		) {
			var text = parsedDocument.replace(/(<([^>]+)>)/gi, '');
			generalParse = domParser(text, 'text/html');
		}
		if (generalParse.getElementsByTagName('body')[0]) {
			for (
				var i = 0;
				i < generalParse.getElementsByTagName('body')[0].children.length;
				i++
			) {
				const row = generalParse.getElementsByTagName('body')[0].children[i];
				if (tags.indexOf(row.nodeName.toLowerCase()) >= 0) {
					checkHsml = true;
					break;
				}
			}
		}

		if (!checkHsml) {
			return (parsedDocument =
				'<bubble><text>' + parsedDocument + '</text></bubble>');
		} else {
			return parsedDocument;
		}
	}

	function isParseError(parsedDocument) {
		// xml parser 오류 체크
		var agent = navigator.userAgent.toLowerCase();
		if (
			(navigator.appName == 'Netscape' &&
				navigator.userAgent.search('Trident') != -1) ||
			agent.indexOf('msie') != -1
		) {
			// IE 예외처리
			return false;
		} else {
			var parser = new DOMParser(),
				errorneousParse = parser.parseFromString('<', 'text/xml'),
				parsererrorNS = errorneousParse.getElementsByTagName('parsererror')[0]
					.namespaceURI;

			if (parsererrorNS === 'http://www.w3.org/1999/xhtml') {
				// In PhantomJS the parseerror element doesn't seem to have a special namespace, so we are just guessing here :(
				return parsedDocument.getElementsByTagName('parsererror').length > 0;
			}

			return (
				parsedDocument.getElementsByTagNameNS(parsererrorNS, 'parsererror')
					.length > 0
			);
		}
	}

	function getInnerHTML(xml) {
		// IE 대응 InnerHTML 함수
		let html = '';
		html = xml.outerHTML || new XMLSerializer().serializeToString(xml);
		html = html.replace(/(<text>|<\/text>)/gi, '');
		return html;
	}

	function xmlToJson(xml) {
		// xml to json

		// Create the return object
		var obj = {};

		if (xml.nodeType == 1) {
			obj['@attributes'] = {}; // 속성 정의
			obj['@nodeName'] = '';
			obj['@textContent'] = '';
			obj['@innerHTML'] = '';

			// element
			// do attributes
			if (xml.attributes.length > 0) {
				for (var j = 0; j < xml.attributes.length; j++) {
					var attribute = xml.attributes.item(j);
					if (
						tags.indexOf(xml.nodeName.toLowerCase()) >= 0 &&
						xml.nodeName != 'hsml'
					) {
						obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
					}
				}
			}

			obj['@nodeName'] = xml.nodeName; // 속성명 정의
			obj['@textContent'] = xml.textContent;
			obj['@innerHTML'] = xml.innerHTML;

			if (xml.nodeName == 'text') {
				if (!obj['@attributes']) {
					obj['@attributes'] = {};
				}

				obj['@attributes']['text'] = getInnerHTML(xml);
				const text = obj['@attributes']['text'];
				obj['@attributes']['text'] = text.unescapeHtml();

				if (obj['@attributes']['src']) {
					const src = obj['@attributes']['src'];
					obj['@attributes']['src'] = src.unescapeHtml();
				}
			} else if (xml.nodeName == 'bubble') {
				if (obj['@attributes']['emotion']) {
					emotion = obj['@attributes']['emotion'];
				}
			} else if (xml.nodeName == 'html') {
				if (!obj['@attributes']) {
					obj['@attributes'] = {};
				}

				obj['@attributes']['text'] = getInnerHTML(xml);
				const text = obj['@attributes']['text'];
				obj['@attributes']['text'] = text.unescapeHtml();
			} else if (xml.nodeName == 'checkbox') {
				const checkbox = {
					dqml: null,
				};
				for (
					var checkbox_i = 0;
					checkbox_i < xml.childNodes.length;
					checkbox_i++
				) {
					var checkbox_item = xml.childNodes.item(checkbox_i);

					if (checkbox_item.nodeName == 'dqml') {
						checkbox.dqml = checkbox_item.textContent;
					}
				}

				if (checkbox.dqml) {
					obj['@attributes']['dqml'] = checkbox.dqml;
				}
			} else if (xml.nodeName == 'radiobutton') {
				const checkbox = {
					dqml: null,
				};
				for (
					var radiobutton_i = 0;
					radiobutton_i < xml.childNodes.length;
					radiobutton_i++
				) {
					var radiobutton_item = xml.childNodes.item(radiobutton_i);

					if (radiobutton_item.nodeName == 'dqml') {
						checkbox.dqml = radiobutton_item.textContent;
					}
				}

				if (checkbox.dqml) {
					obj['@attributes']['dqml'] = checkbox.dqml;
				}
			} else if (xml.nodeName == 'input') {
				const input = {
					event: null,
					dqml: null,
				};
				for (var input_i = 0; input_i < xml.childNodes.length; input_i++) {
					var input_item = xml.childNodes.item(input_i);

					if (input_item.nodeName == 'event') {
						input.event = input_item.textContent.replace(/(\s*)/g, '');
					}

					if (input_item.nodeName == 'dqml') {
						input.dqml = button_item.textContent;
					}
				}
				xml.innerHTML = '';
				if (input.event) {
					obj['@attributes']['event'] = input.event;
				}
				if (input.dqml) {
					obj['@attributes']['dqml'] = input.dqml;
				}
			} else if (xml.nodeName == 'button') {
				// CDATA 예외

				if (!obj['@attributes']['label']) {
					obj['@attributes']['label'] = xml.textContent;
				} else if (obj['@attributes']['label'].length == 0) {
					obj['@attributes']['label'] = xml.textContent;
				}

				if (obj['@attributes']['label']) {
					const label = obj['@attributes']['label'];
					obj['@attributes']['label'] = label.unescapeHtml();
				}
				if (obj['@attributes']['src']) {
					const src = obj['@attributes']['src'];
					obj['@attributes']['src'] = src.unescapeHtml();
				}
				const button = {
					data: null,
					dqml: null,
				};
				for (var button_i = 0; button_i < xml.childNodes.length; button_i++) {
					var button_item = xml.childNodes.item(button_i);

					if (button_item.nodeName == 'data') {
						button.data = button_item.textContent;
					}
					if (button_item.nodeName == 'dqml') {
						button.dqml = button_item.textContent;
					}
				}
				xml.innerHTML = '';
				if (button.data) {
					obj['@attributes']['data'] = button.data;
				}
				if (button.dqml) {
					obj['@attributes']['dqml'] = button.dqml;
				}
			} else if (xml.nodeName == 'layout-table') {
				// table data 정의 및 하위 요소 삭제
				if (xml.hasChildNodes()) {
					const table = {
						column: [],
						items: [],
					};
					for (var table_i = 0; table_i < xml.childNodes.length; table_i++) {
						var table_item = xml.childNodes.item(table_i);
						if (table_item.nodeName == 'layout') {
							if (table_item.getAttribute('id') == 'head') {
								// head
								if (table_item.hasChildNodes()) {
									var indexNum = -1;
									for (
										var table_head_i = 0;
										table_head_i < table_item.childNodes.length;
										table_head_i++
									) {
										var table_item_head = table_item.childNodes.item(
											table_head_i,
										);
										if (table_item_head.nodeName == 'text') {
											indexNum = indexNum + 1;

											let name_text = table_item_head.innerHTML
												? table_item_head.innerHTML
												: table_item_head.textContent;

											name_text = name_text.unescapeHtml();

											table.column.push({
												name: name_text,
												apiColName: 'column' + indexNum,
												id: table_item_head.getAttribute('id'),
												url: table_item_head.getAttribute('url'),
												align: table_item_head.getAttribute('align'),
											});
										}
									}
								}
							} else {
								// row
								if (table_item.hasChildNodes()) {
									const table_row_item = Object();
									var rowIdx = -1;
									for (
										var table_row_i = 0;
										table_row_i < table_item.childNodes.length;
										table_row_i++
									) {
										var table_item_row = table_item.childNodes.item(
											table_row_i,
										);

										if (table_item_row.nodeName == 'text') {
											rowIdx = rowIdx + 1;

											let table_text = table_item_row.innerHTML
												? table_item_row.innerHTML
												: table_item_row.textContent;

											table_text = table_text.unescapeHtml();

											table_row_item['column' + rowIdx] = table_text;

											table_row_item['column' + rowIdx].unescapeHtml();
											if (table_item_row.getAttribute('url') !== null) {
												table_row_item['url'] = table_item_row.getAttribute(
													'url',
												);
											}
											if (table_item_row.getAttribute('modal') !== null) {
												table_row_item['modal'] = table_item_row.getAttribute(
													'modal',
												);
											}
											if (table_item_row.getAttribute('label') !== null) {
												table_row_item['label'] = table_item_row.getAttribute(
													'label',
												);
											}
											if (table_item_row.getAttribute('regDt') !== null) {
												table_row_item[
													'column' + (table_row_i + 1)
												] = table_item_row.getAttribute('regDt');
											}
										}
									}
									table.items.push(table_row_item);
								}
							}
						}
					}
					xml.innerHTML = '';
					xml.textContent = '';
					obj['@attributes']['column'] = table.column;
					obj['@attributes']['items'] = table.items;
				}
			} else if (xml.nodeName == 'select') {
				// table data 정의 및 하위 요소 삭제
				if (xml.hasChildNodes()) {
					const select = {
						option: [],
					};
					for (var select_i = 0; select_i < xml.childNodes.length; select_i++) {
						var select_item = xml.childNodes.item(select_i);
						var select_item_value = '';
						var select_item_dqml = '';
						if (select_item.nodeName == 'item') {
							if (select_item.attributes.length > 0) {
								for (
									var item_i = 0;
									item_i < select_item.attributes.length;
									item_i++
								) {
									var select_item_attribute = select_item.attributes.item(
										item_i,
									);
									if (select_item.nodeName.toLowerCase() == 'item') {
										if (select_item_attribute.nodeName == 'transfer-text') {
											select_item_value = select_item_attribute.nodeValue;
										}
										if (select_item_attribute.nodeName == 'dqml') {
											select_item_dqml = select_item_attribute.nodeValue;
										}
									}
								}
							}
							select.option.push({
								displayText: select_item.textContent,
								transferText: select_item_value
									? select_item_value
									: select_item.textContent,
								dqml: select_item_dqml,
							});
						}
					}
					xml.innerHTML = '';
					obj['@attributes']['item'] = select.option;
				}
			} else if (xml.nodeName == 'hsml') {
				// hsml
			} else if (xml.nodeName == 'layout') {
				// hsml class 속성 변경
				if (xml.getAttribute('nav') == 'true') {
					obj['@attributes']['nav'] = true;
				} else if (xml.getAttribute('nav') == 'false') {
					obj['@attributes']['nav'] = false;
				}
				if (xml.getAttribute('dots') == 'true') {
					obj['@attributes']['dots'] = true;
				} else if (xml.getAttribute('dots') == 'false') {
					obj['@attributes']['dots'] = false;
				}
			}
		} else if (xml.nodeType == 3) {
			// text
			obj = xml.nodeValue;
		}

		// do children
		if (xml.hasChildNodes()) {
			for (var i = 0; i < xml.childNodes.length; i++) {
				var item = xml.childNodes.item(i);
				var nodeName = item.nodeName;
				if (nodeName.indexOf('#') == -1) {
					const node = xmlToJson(item);
					node['@nodeId'] = 'ans_' + item.nodeName + '_' + i;
					if (nodeName == 'button') {
						node['@slotName'] = 'ans_' + nodeName + '_' + i;
						isButton = true;
					}

					if (tags.indexOf(nodeName.toLowerCase()) >= 0) {
						obj['ans_' + nodeName + '_' + i] = node;
					}
				}
			}
		}

		return obj;
	}

	if (isParseError(xmlDoc)) {
		// throw new Error('Error parsing XML');
	}

	const json = xmlToJson(xmlDoc);

	// 자동 발화 유무 처리
	if (!isButton) {
		json['ans_hsml_0']['@autoClick'] = true;
	} else {
		json['ans_hsml_0']['@autoClick'] = false;
	}

	// 이모티콘 정의
	if (emotion) {
		json['ans_hsml_0']['@attributes']['emotion'] = emotion;
	}

	return json;
}
