import jwt from 'jsonwebtoken'

//admin authentication middleware
const authAdmin = async (req,res,next)=>{
    try{
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.json({ success: false, message: 'Access denied. No token provided.' });
        }
           // ✅ Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // ✅ Check if the user is azn admin
        if (decoded.email !== process.env.ADMIN_EMAIL) {
            return res.json({ success: false, message: 'Access denied. Admins only.' });
        }
        
        req.user = decoded;
        next(); 
    }catch(error){
        console.log(error)
        res.json({success:false,Message:error.Message})
    }
}

export default authAdmin