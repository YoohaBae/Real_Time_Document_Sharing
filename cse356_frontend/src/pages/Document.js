import React, {useEffect, useState} from 'react';
import {useParams} from "react-router-dom";
import ReactQuill from 'react-quill';
import urlJoin from "url-join";
import axios from 'axios';
import 'react-quill/dist/quill.snow.css';

const {REACT_APP_BACKEND_URL} = process.env;

const Document = (props) => {
    let documentID = useParams().id;
    const establishConnection = () => {
        return axios.get(urlJoin(
            REACT_APP_BACKEND_URL + "/api/connect/" + documentID
        ));
    }

    useEffect(() => {
        establishConnection().then((res) => {
            console.log(res.data);
        })
    })

    const [value, setValue] = useState('');

    return <ReactQuill theme="snow" value={value} onChange={setValue}/>;
}
export default Document;