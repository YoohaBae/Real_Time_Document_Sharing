import * as Y from 'yjs'
import * as base64 from "byte-base64";

class CRDTFormat {
    public bold?: Boolean = false;
    public italic?: Boolean = false;
    public underline?: Boolean = false;
}

const jsonStringToUint8Array = (jsonString: string) => {
    let json = JSON.parse(jsonString);
    let ret = new Uint8Array(Object.keys(json).length);
    for (let key in json) {
        console.log(key, json[key]);
        // @ts-ignore
        ret[key] = json[key];
    }
    return ret
};


exports.CRDT = class {
    doc = new Y.Doc();
    text = this.doc.getText('test');
    cb: (update: string, isLocal: Boolean) => void;

    constructor(cb: (update: string, isLocal: Boolean) => void) {
        this.cb = cb;
        ['update', 'insert', 'delete', 'toHTML'].forEach(f => (this as any)[f] = (this as any)[f].bind(this));
    }

    update(update: string) {
        let data = jsonStringToUint8Array(update);
        Y.applyUpdate(this.doc, data);
        this.cb(this.toHTML(), false);
    }

    insert(index: number, content: string, format: CRDTFormat) {
        this.doc.on('update', (update) => {
            let message = ({
                clientID: this.doc.clientID,
                update: base64.bytesToBase64(update)
            })
            this.cb(JSON.stringify(message), true);
        })
        this.text.insert(index, content, format);
    }

    delete(index: number, length: number) {
        this.doc.on('update', (update) => {
            let message = ({
                clientID: this.doc.clientID,
                update: base64.bytesToBase64(update)
            })
            this.cb(JSON.stringify(message), true);
        })
        this.text.delete(index, length);
    }

    toHTML() {
        let html = "";
        let delta = this.doc.getText('test').toDelta();
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
