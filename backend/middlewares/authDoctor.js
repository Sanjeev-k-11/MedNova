import jwt from 'jsonwebtoken'

//Doctor authentication middleware
const authDoctor = async (req,res,next)=>{
    try{
        const dtoken = req.headers.authorization?.split(" ")[1];
        if (!dtoken) {
            return res.json({ success: false, message: 'Not Authorized Login.' });
        }
           // ✅ Verify the token
        const decoded = jwt.verify(dtoken, process.env.JWT_SECRET)

        req.body.docId = decoded.id
        next(); 


        
    }catch(error){
        console.log(error)
        res.json({success:false,Message:error.Message})
    }
}

export default authDoctor