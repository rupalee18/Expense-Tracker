const { isLoggedIn } = require("../middlewares/auth-middleware");
const hisaabModel = require("../models/hisaab-model");
const userModel = require("../models/user-model");
const { all } = require("../routes/indexRouter");
module.exports.createPageController = function(req,res){
    let message =req.flash('error2')
    res.render("create",{error:message});
}
module.exports.postCreateController = async function(req,res){
    let { title, description, encrypted, passcode, shareable, editable , important, total} = req.body;
    // console.log(title, description, encrypted, passcode, shareable, editpermissions)
    encrypted = encrypted === "on" ? true : false;
    shareable = shareable === "on"? true : false;
    editable = editable === "on"? true : false;
    important = important === "on"? true : false;
    if (encrypted && !passcode) {
        
        req.flash("error2"," password is required")
        return res.redirect("/hisaab/create")
    }
    
    let hisaab = await hisaabModel.create({
        title,
        description,
        user:req.user._id,
        encrypted,
        passcode,
        shareable,
        important,
        editable,
        total,
    })
    
    let user = await userModel.findOne({email:req.user.email})
    user.hisaabs.push(hisaab._id)
    user.total = hisaab.total + user.total
    await user.save();
    res.redirect("/profile")
    
}
module.exports.showhisaabController = async function(req,res){
    let hisaab = await hisaabModel.findOne({_id:req.params.id})
    
    if (hisaab.encrypted && allowed === 0)  { 
        let error = req.flash('error')
        return res.render("passcode",{id:req.params.id,error});
    }
    // console.log(hisaab);
    allowed = 0
    let error = req.flash('error2')
    res.render("hisaab",{hisaab,error});
}
module.exports.deletehisaabController = async function(req,res){
    let user = req.user

    if (user.hisaabs.indexOf(req.params.id) === -1){
        req.flash("error2","You do not have permissions to delete this")
        return res.redirect(`/hisaab/view/${req.params.id}`)
    }
    let hisaabs = await hisaabModel.findOne({_id:req.params.id})
    user.total = user.total - hisaabs.total
    user.hisaabs.remove(req.params.id)
    await user.save()
    await hisaabModel.deleteOne({_id:req.params.id})

    res.redirect("/profile");
}
module.exports.edithisaabController = async function(req,res){
    let hisaab = await hisaabModel.findOne({_id:req.params.id,user:req.user._id})
    if (!hisaab){
        req.flash("error2","hisaab not found")
        return res.redirect(`/profile`)
    }

    return res.render("edit",{hisaab})
}

module.exports.updateHisaabController = async function(req,res){
    let hisaab = await hisaabModel.findOne({_id:req.params.id,user:req.user._id})
    if (!hisaab){
        req.flash("error2","hisaab not found")
        return res.redirect(`/profile`)
    }
    let newExpense = hisaab.total - req.body.total
    hisaab.title = req.body.title;
    hisaab.total = req.body.total;
    hisaab.description = req.body.description;
    hisaab.encrypted = req.body.encrypted === "on"? true : false;
    hisaab.shareable = req.body.shareable === "on"? true : false;
    hisaab.editable = req.body.editable === "on"? true : false;
    hisaab.important = req.body.important === "on"? true : false;
    let user = hisaab.user;
    user.total = user.total + newExpense;
    await user.save();
    await hisaab.save();
    res.redirect(`/hisaab/view/${req.params.id}`)
}
var allowed = 0;
module.exports.verifyhisaabController = async function(req,res){
    let hisaab = await hisaabModel.findOne({_id:req.params.id});
        if (req.body.passcode === hisaab.passcode){
            allowed = 1;
            return res.redirect(`/hisaab/view/${req.params.id}`)
        }
        else{
            allowed = 0;
            req.flash("error","wrong passcode")
            return res.redirect(`/hisaab/view/${req.params.id}`)
        }
    
    // else{
    //     res.redirect(`/hisaab/view/${req.params.id}`)
    // }
}