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
        this.text.insert(index, content, format);
    }

    delete(index: number, length: number) {
        this.text.delete(index, length);
    }

    toHTML() {
        let html = "";
        let delta = this.doc.getText('test').toDelta()
        // @ts-ignore
        for (let index in delta) {
            // @ts-ignore
            let action = delta[index]
            if (action["insert"] !== undefined) {
                // @ts-ignore
                let curr = action["insert"]
                // @ts-ignore
                if (action["attributes"] !== undefined) {
                    // @ts-ignore
                    let attribute = action["attributes"]
                    if (attribute["bold"] == true) {
                        curr = '<b>' + curr + '</b>'
                    }
                    if (attribute["italic"] == true) {
                        curr = '<i>' + curr + '</i>'
                    }
                    if (attribute["underline"] == true) {
                        curr = '<u>' + curr + '</u>'
                    }
                }
                html = html + curr;
            }
        }
        console.log(html)
        console.log(delta)
        return html;
    }
};
