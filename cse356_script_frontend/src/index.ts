import * as Y from 'yjs';
// @ts-ignore
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';

class CRDTFormat {
  public bold?: Boolean = false;
  public italic?: Boolean = false;
  public underline?: Boolean = false;
}

function jsonStringToUint8Array(jsonString: string) {
  let json = JSON.parse(jsonString);
  let clientID = json['clientID'];
  let ret = null;
  let update = json['update'];
  ret = new Uint8Array(Object.keys(update).length);
  for (let key in update) {
    // @ts-ignore
    ret[key] = update[key];
  }
  return [clientID, ret];
}

exports.CRDT = class {
  doc = new Y.Doc();
  text = this.doc.get('test2', Y.XmlText);
  cb: (update: string, isLocal: Boolean) => void;

  constructor(cb: (update: string, isLocal: Boolean) => void) {
    this.cb = cb;
    ['update', 'insert', 'delete', 'toHTML', 'insertImage'].forEach(
      (f) => ((this as any)[f] = (this as any)[f].bind(this))
    );
    this.doc.on('update', (update, origin) => {
      if (origin === this.doc.clientID) {
        let message = {
          update: update,
          clientID: origin,
        };
        this.cb(JSON.stringify(message), true);
      } else {
        this.cb(this.toHTML(), false);
      }
    });
  }

  update(update: string) {
    // axios.post('http://194.113.72.22/log' , {update, function: "update"})
    //             .then(response => console.log(response));
    let [clientId, data] = jsonStringToUint8Array(update);
    if (clientId !== this.doc.clientID) {
      Y.applyUpdate(this.doc, data, clientId);
    }
  }

  insert(index: number, content: string, format: CRDTFormat) {
    // axios.post('http://194.113.72.22/log' , {index, content, format, function: "insert"})
    //             .then(response => console.log(response));
    // @ts-ignore
    this.text.insert(index, content, format);
  }

  delete(index: number, length: number) {
    // axios.post('http://194.113.72.22/log' , {index, length, function: "delete"})
    //             .then(response => console.log(response));
    // @ts-ignore
    this.text.delete(index, length);
  }

  insertImage(index: number, url: string) {
    // @ts-ignore
    this.text.insert(index, { img: { src: url } });
  }

  toHTML() {
    // @ts-ignore
    let delta = this.doc.get('test2', Y.XmlText).toDelta();
    // @ts-ignore
    let cfg = {
      paragraphTag: 'p',
    };
    let converter = new QuillDeltaToHtmlConverter(delta, cfg);
    // @ts-ignore
    converter.renderCustomWith(function (customOp, contextOp) {
      if (customOp.insert.type === 'img') {
        let val = customOp.insert.value;
        return `<img src="${val.src}"/>`;
      } else {
        return 'error!';
      }
    });
    return converter.convert();
  }
};
