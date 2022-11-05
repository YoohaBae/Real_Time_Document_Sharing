import {useNavigate} from 'react-router-dom';
import {useState} from "react";

const StartPage = () => {
    const [docID, setDocID] = useState('')
    const navigate = useNavigate();
    const handleChange = (event) => {
        setDocID(event.target.value);
    }
    const openDocument = (event) => {
        event.preventDefault();
        navigate(`/doc/${docID}`);
    }
    return (<div>
        <Link to={"/login"}>Login</Link>
        <Link to={"/auth"}>Auth</Link>
        <Link to={"/doc"}>Create Document</Link>
    </div>)
}
export default StartPage;