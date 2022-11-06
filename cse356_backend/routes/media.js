const const express = require('express');
const router = express.Router();

const auth = async (req, res, next) => {
    const key = req.cookies.key;
    if (!key) {
      res.send({
        error: true,
        message: 'User is not authenticated',
      });
    } else {
      try {
        const user = await User.findOne({ key });
        if (!user) {
          res.send({
            error: true,
            message: 'User is not authenticated',
          });
        } else {
          next();
        }
      } catch {
        res.send({
          error: true,
          message: 'User is not authenticated',
        });
      }
    }
  };

router.use(auth)

router.post("/upload", (req, res) => {

})

router.get("/access/:mediaid", (req, res) => {
    const id = req.params.mediaid
    
})