import * as Y from 'yjs'

class CRDTFormat {
  public bold?: Boolean = false;
  public italic?: Boolean = false;
  public underline?: Boolean = false;
};

exports.CRDT = class {
  doc = new Y.Doc()
  text = this.doc.getText('test')

  constructor(cb: (update: string, isLocal: Boolean) => void) {
    console.log(cb);
    ['update', 'insert', 'delete', 'toHTML'].forEach(f => (this as any)[f] = (this as any)[f].bind(this));
  }

  update(update: string) {
    console.log(update);
  }

  insert(index: number, content: string, format: CRDTFormat) {
    if (format) {
      if (format.bold) {
        content = "<b>" + content + "</b>"
      }
    }

    this.text.insert(index, content);
    console.log(this.text);
  }

  delete(index: number, length: number) {
    this.text.delete(index, length);
  }

  toHTML() {

    let html = this.doc.getText('test');
    // ...
    return html;
  }
};
