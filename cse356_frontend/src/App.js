import React from "react";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import './App.css';
import StartPage from "./pages/StartPage";
import Document from "./pages/Document";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<StartPage/>}/>
                <Route path="/doc/:id" element={<Document/>}/>
            </Routes>
        </Router>
    );
}

export default App;
