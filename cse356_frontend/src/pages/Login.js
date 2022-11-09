import {useNavigate} from 'react-router-dom';
import {useState} from "react";
import urlJoin from "url-join";
import axios from "axios";

const {REACT_APP_BACKEND_URL} = process.env;

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate();
    const handleEmailChange  = (event) => {
        setEmail(event.target.value);
    }
    const handlePasswordChange  = (event) => {
        setPassword(event.target.value);
    }
    const login = (event) => {
        event.preventDefault();
        let userInfo = {
            "email": email,
            "password": password
        }
        axios.post(urlJoin(REACT_APP_BACKEND_URL, "/users/login"), userInfo)
            .then(response => {
                navigate("/")
            });
    }
    return (<div>
        <h1>Login</h1>
        <label htmlFor="email">Email:</label>
        <input type="text" id="email" name={"Email"} onChange={handleEmailChange}/>
        <br/>
        <label htmlFor="password">Password:</label>
        <input type="password" id="password" name={"Password"} onChange={handlePasswordChange}/>
        <input type="button" value="Open" onClick={login}/>
    </div>)
}
export default Login;