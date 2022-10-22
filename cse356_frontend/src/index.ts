// ... add imports and fill in the code

class CRDTFormat {
  public bold?: Boolean = false;
  public italic?: Boolean = false;
  public underline?: Boolean = false;
};

exports.CRDT = class {
  // ...

  constructor(cb: (update: string, isLocal: Boolean) => void) {
    // ...
    ['update', 'insert', 'delete', 'toHTML'].forEach(f => (this as any)[f] = (this as any)[f].bind(this));
  }

  update(update: string) {
    // ...
  }

  insert(index: number, content: string, format: CRDTFormat) {
    // ...
  }

  delete(index: number, length: number) {
    // ...
  }

  toHTML() {
    let html = '(fill me in)';
    // ...
    return html;
  }
};
