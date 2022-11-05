import {Link} from 'react-router-dom';

const StartPage = () => {
    return (<div>
        <Link to={"/login"}>Login</Link>
        <br/>
        <Link to={"/auth"}>Auth</Link>
        <br/>
        <Link to={"/doc"}>Create Document</Link>
    </div>)
}
export default StartPage;