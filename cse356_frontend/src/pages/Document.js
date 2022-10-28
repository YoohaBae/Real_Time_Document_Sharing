import React, {useEffect, useState} from 'react';
import {useParams} from "react-router-dom";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import urlJoin from "url-join";
import * as Y from 'yjs';

const {REACT_APP_BACKEND_URL} = process.env;

const Document = (props) => {
    let documentID = useParams().id;
    const ydoc = new Y.Doc()
    const ytext = ydoc.getText('test');

    const updateCb = (update) => {
        document.write('<nobr>update> ', update, '</nobr><br/>');
    }



    useEffect(() => {
        const sse = new EventSource(urlJoin(REACT_APP_BACKEND_URL + "/api/connect/" + documentID));
        sse.onerror = () => {
            console.log("error");
            sse.close();
        }
        sse.onopen = () => {
            console.log("Sse open");
        }
        sse.addEventListener('sync', (event) => {
            let data = JSON.parse(event.data);
            console.log(data);
        })
        sse.addEventListener('update', (event) => {
            let data = JSON.parse(event.data);
            console.log(data);
        })
        return () => {
            sse.close();
        };
    }, [documentID])

    const [value, setValue] = useState('');

    return <ReactQuill theme="snow" value={value} onChange={setValue}/>;
}
export default Document;