const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");

//create a post
router.post("/" ,async (req,res) => {
    const newPost = new Post(req.body)
    try{
        const savedPost = await newPost.save();
        res.status(200).json(savedPost);
    }catch(e){
        res.status(500).json(e);
    }
})
//update a post
router.put("/:id" , async(req, res) => {
    const post = await Post.findById(req.params.id);
    try{
        console.log("user id is",post.userId);

        if(post.userId === req.body.userId){
            console.log("user id is",post.userId);
            const updatedPost = await post.updateOne({$set: req.body});
            res.status(200).json(updatedPost);
        }else{
            res.status(403).json("You can not update this post");
        }
    }catch(e){
        res.status(500).json(e);
    }
})
//delete a post
router.delete("/:id" , async(req, res) => {
    const post = await Post.findById(req.params.id);
    try{

        if(post.userId === req.body.userId){
            await post.deleteOne();
            res.status(200).json("post has been deleted");
        }else{
            res.status(403).json("You can not delete this post");
        }
    }catch(e){
        res.status(500).json(e);
    }
})
//like dislike a post
router.put("/:id/like", async(req, res) => {
    try{
        const post = await Post.findById(req.params.id);
        if(!post.likes.includes(req.body.userId)){
            await post.updateOne({$push : {likes:req.body.userId}});
            res.status(200).json("The post has been liked");
        }else{
            await post.updateOne({$pull:{likes: req.body.userId}});
            res.status(200).json("The post has been disliked");
        }
    }catch(e){
        res.status(500).json(e);
    }
});

//get a post
router.get("/:id", async(req, res) => {
    try{
        const post = await Post.findById(req.params.id);
        res.status(200).json(post);
    }catch(e){
        res.status(500).json(e);
    }
})
//get timeline post
router.get("/timeline/:userId", async(req, res) => {
    try{
        const currUser = await User.findById(req.params.userId);
        const userPosts = await Post.find({userId :currUser._id});
        const friendPosts = await Promise.all(
            currUser.following.map(friendId => {
                return Post.find({userId: friendId});
            })
        );
        res.status(200).json(userPosts.concat(...friendPosts))
    }catch(e){
        res.status(500).json(e);
    }
})

//get all posts:
router.get("/profile/:username", async(req, res) => {
    try{
        const user = await User.findOne({username: req.params.username})
        console.log(user)
        const posts = await Post.find({userId : user._id})
        res.status(200).json(posts);
    }catch(e){
        console.log(e);
        // res.status(500).json(e);
    }
})


module.exports = router;