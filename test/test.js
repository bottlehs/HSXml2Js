import {xmlParser} from '../lib/index';

test('XML to Json',() => {
  console.log(xmlParser)
  const xml = 
  "<bubble>"+
  "<text>hello</text>"+  
  "<bubble>";

  const json = xmlParser(xml);
  console.log(json);
});
