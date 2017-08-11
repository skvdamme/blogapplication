const Sequelize = require('sequelize');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const sequelize = new Sequelize('blogapplication', 'samantha_kaylee', null, {
	host: 'localhost',
	dialect: 'postgres'
});

const app = express();

app.set('views', './views');
app.set('view engine', 'pug');

app.use(express.static(__dirname + "/../public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
	secret: "whatever",
	saveUninitialized: true,
	resave: false
}));

const User = sequelize.define('user',{
	email: {
		type: Sequelize.STRING,
		unique: true
	},
	password: {
		type: Sequelize.STRING
	}
	},{
		timestamps:false
	});


const Message = sequelize.define('message',{
	title: {
		type: Sequelize.STRING,
	},
	message: {
		type: Sequelize.STRING
	}
},{
	timestamps:false
});

const Comment = sequelize.define('comment', {
	comments: {
		type: Sequelize.STRING
	}
});

User.hasMany(Message);
Message.belongsTo(User);
User.hasMany(Comment);
Comment.belongsTo(User);
Message.hasMany(Comment);
Comment.belongsTo(Message);

app.get('/', function(req,res){
	res.render('index', {
		message: req.query.message,
		user: req.session.user
	});
});

app.get('/register', function(req,res){
	console.log(req.session)
	res.render('register')
});

app.post('/register', (req,res)=>{
	User.create({
		email: req.body.email,
		password: req.body.password
	})
	.then((user) => {
		req.session.user = user;
		res.redirect('/profile');
	}).catch((error) =>{
		console.log(error)
	});
}); 

app.post('/wall', function (req,res){
	var user = req.session.user;
	console.log('this is my info as a user '+ user);

	let sendingTitle = req.body.title;
	let sendingMessage = req.body.message;

	User.findOne({
		where: {
			email: user.email
		}
	}).then((user)=>{
		return user.createMessage({
			title: sendingTitle,
			message: sendingMessage
		})
		.then(()=>{
			res.redirect('/wall')
		})
		.catch((error) =>{
		console.log(error)
		});
	});
});


app.get('/wall', function (req, res) {
	let user = req.session.user;
	console.log(user)
	Message.findAll({
		include: [{
			model: Comment
		}]
	})
	.then(function(messages) {
	res.render('wall', {user:user, messages: messages})
	});
});

app.get('/post/:id', (req,res)=>{
const params = req.params
console.log(params)

	Message.findOne({
		where: {
			id: params.id
		},
			include: [{
				model: Comment
			}]
		
	})
	.then((post)=>{
		var message = post;
		console.log(message)
		res.render('post', {message:message})
	});
});

app.post('/comment/:messageId', (req,res) => {
	var user = req.session.user;
	var messageId = req.params.messageId;
	let sendingComment = req.body.comment;
	console.log('this is my message: '+ messageId);

	User.findOne({
		where: {
			email: user.email
		}
	}).then((user)=>{
		return user.createComment({
			comments: sendingComment,
			messageId: messageId
		})
		.then(()=>{
			res.redirect(`/post/${messageId}`)
		})
		.catch((error) =>{
		console.log(error)
		});
	});
});


app.get('/login', function(req,res){
	res.render('login', {user:req.session.user})
});

app.post('/login', function (req, res) {
	if(req.body.email.lentgh === 0) {
		res.redirect('/?message=' + encodeURIComponent("please fill out your email adress"));
	return;
	}

	if(req.body.password.length === 0) {
		response.redirect('/?message=' + encodeURIComponent("please fill out your password"));
		return;
	}
var email = req.body.email
var password = req.body.password

User.findOne({
	where: {
		email: email
	}
})
.then(function(user) {
	console.log('user email '+ user.email)
	console.log('user password ' + user.password)
	if (user != null && password === user.password) {
		req.session.user = user;
		res.redirect('/profile');
	} else {
		res.redirect('/?message=' + encodeURIComponent("invalid email or password"));
	}
  })
.catch(function (error) {
	console.error(error)
	res.redirect('/?message=' + encodeURIComponent("invalid email or password"));
	});
});

app.get('/profile', (req,res)=>{
	var user = req.session.user;
	if (user === undefined) {
		res.redirect('/?message=' + encodeURIComponent("please log in to view your profile"))
	} else {
	res.render('profile', {
		user: user
	});
   }
});

app.get('/logout', (req,res)=>{
	req.session.destroy((error) =>{
		if(error){
			throw error;
		}
		res.redirect('/?message=' + encodeURIComponent("succesfully logged out"));
	});
});


sequelize.sync();

app.listen(3000, function(){
	console.log('Hey is this thing on?!')
});




















