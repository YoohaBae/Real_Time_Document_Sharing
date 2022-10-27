import * as Y from 'yjs'

class CRDTFormat {
    public bold?: Boolean = false;
    public italic?: Boolean = false;
    public underline?: Boolean = false;
}

exports.CRDT = class {
    doc = new Y.Doc();
    text = this.doc.getText('test');
    cb: (update: string, isLocal: Boolean) => void;

    constructor(cb: (update: string, isLocal: Boolean) => void) {
        this.cb = cb;
        ['update', 'insert', 'delete', 'toHTML'].forEach(f => (this as any)[f] = (this as any)[f].bind(this));
    }

    update(update: string) {
        console.log(update)
    }

    insert(index: number, content: string, format: CRDTFormat) {
        this.text.insert(index, content, format);
        this.cb(this.toHTML(), false);
    }

    delete(index: number, length: number) {
        this.text.delete(index, length);
        this.cb(this.toHTML(), false);
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
                curr = curr.replace("\r\n", "\n").replace("\n", "<br />");

                // @ts-ignore
                if (action["attributes"] !== undefined) {
                    // @ts-ignore
                    let attribute = action["attributes"]
                    if (attribute["bold"] == true) {
                        curr = '<strong>' + curr + '</strong>'
                    }
                    if (attribute["italic"] == true) {
                        curr = '<em>' + curr + '</em>'
                    }
                    if (attribute["underline"] == true) {
                        curr = '<u>' + curr + '</u>'
                    }
                }
                html = html + curr;
            }
        }
        html = '<p>' + html + '</p>'
        return html;
    }
};
