import React, {useEffect, useState} from 'react';
import {useParams} from "react-router-dom";
import {QuillBinding} from 'y-quill'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
import 'react-quill/dist/quill.snow.css';
import urlJoin from "url-join";
import * as Y from 'yjs';
import axios from 'axios';
//import * as base64 from "byte-base64";

const {REACT_APP_BACKEND_URL} = process.env;

Quill.register('modules/cursors', QuillCursors);

const jsonStringToUint8Array = (jsonString) => {
    let json = JSON.parse(jsonString)
    let clientID = json["clientID"];
    let ret = null;
    let update = json["update"]
    ret = new Uint8Array(Object.keys(update).length);
    for (let key in update) {
        // @ts-ignore
        ret[key] = update[key];
    }
    return [clientID, ret]
};

const Document = () => {
    let documentID = useParams().id;

    useEffect(() => {
        const editorContainer = document.getElementById('editor');
        let ydoc = new Y.Doc();
        let ytext = ydoc.getText(documentID);

        const editor = new Quill(editorContainer, {
            modules: {
                cursors: true,
                toolbar: [
                    ['bold', 'italic', 'underline']
                ],
                history: {
                    userOnly: true
                }
            },
            placeholder: 'Start collaborating...',
            theme: 'snow' // or 'bubble'
        })

        const binding = new QuillBinding(ytext, editor);

        const sse = new EventSource(urlJoin(REACT_APP_BACKEND_URL + "/api/connect/" + documentID), {withCredentials: true});


        sse.onopen = () => {
            console.log("Sse open");
        }

        sse.addEventListener('sync', (event) => {
            let [clientID, data] = jsonStringToUint8Array(event.data);
            Y.applyUpdate(ydoc, data);
        })
        sse.addEventListener('update', (event) => {
            let [clientID, data] = jsonStringToUint8Array(event.data);

            if (clientID !== ydoc.clientID) {
                Y.applyUpdate(ydoc, data);
            }
        })

        ydoc.on('update', (update, origin, doc) => {
            console.log("update: " + update)
            let message = ({
                clientID: ydoc.clientID,
                //update: base64.bytesToBase64(update)
                update: update
            })
            if (origin === binding) {
                axios.post(urlJoin(REACT_APP_BACKEND_URL, 'api/op/' + documentID), message, {withCredentials: true})
                    .then(response => console.log(response));
            }
        })

        return () => {
            sse.close();
        };
    }, [documentID])

    return <div id={"editor"}></div>;
}
export default Document;