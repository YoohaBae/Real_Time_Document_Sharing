import {useNavigate} from 'react-router-dom';
import {useState} from "react";
import urlJoin from "url-join";
import axios from "axios";

const {REACT_APP_BACKEND_URL} = process.env;

const Auth = () => {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate();
    const handleNameChange = (event) => {
        setName(event.target.value);
    }
    const handleEmailChange = (event) => {
        setEmail(event.target.value);
    }
    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
    }
    const createUser = (event) => {
        event.preventDefault();
        let userInfo = {
            "name": name,
            "email": email,
            "password": password
        }
        axios.post(urlJoin(REACT_APP_BACKEND_URL, '/users/signup'), userInfo, {withCredentials: true, credentials: "include"})
            .then(response => {
                navigate("/")
            });
    }
    return (<div>
        <h1>Auth</h1>
        <label htmlFor="name">Name:</label>
        <input type="text" id="name" name={"Name"} onChange={handleNameChange}/>
        <br/>
        <label htmlFor="email">Email:</label>
        <input type="text" id="email" name={"Email"} onChange={handleEmailChange}/>
        <br/>
        <label htmlFor="password">Password:</label>
        <input type="password" id="password" name={"Password"} onChange={handlePasswordChange}/>
        <br/>
        <input type="button" value="Open" onClick={createUser}/>
    </div>)
}
export default Auth;