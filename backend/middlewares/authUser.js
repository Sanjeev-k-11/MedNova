import jwt from 'jsonwebtoken'


//authUser authentication middleware
const authUser = async (req,res,next)=>{
    try{
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.json({ success: false, message: 'Not Authorized Login.' });
        }
           // ✅ Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.body.userId = decoded.id
        
        
        
        next(); 
    }catch(error){
        console.log(error)
        res.json({success:false,Message:error.Message})
    }
}

export default authUser