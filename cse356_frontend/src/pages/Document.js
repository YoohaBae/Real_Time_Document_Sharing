import React, {useEffect, useState} from 'react';
import {useParams} from "react-router-dom";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import urlJoin from "url-join";

const {REACT_APP_BACKEND_URL} = process.env;

const Document = (props) => {
    let documentID = useParams().id;


    useEffect(() => {
        const sse = new EventSource(urlJoin(REACT_APP_BACKEND_URL + "/api/connect/" + documentID));
        sse.onerror = () => {
            console.log("error");
            sse.close();
        }
        sse.onopen = () => {
            console.log("Sse open");
        }
        sse.onmessage = (event) => {
            console.log(event.data)
        }
        return () => {
            sse.close();
        };
    }, [documentID])

    const [value, setValue] = useState('');

    return <ReactQuill theme="snow" value={value} onChange={setValue}/>;
}
export default Document;