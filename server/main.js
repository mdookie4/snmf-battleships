//setup libraries
require('dotenv').config()
const express = require('express')
const expressWS = require('express-ws')
const mysql = require('mysql2/promise')

const sha1 = require('sha1')
const cors = require('cors')
const morgan = require('morgan')
const bodyparser = require('body-parser')

//AWS init middleware
const aws = require('aws-sdk'),
      multer = require('multer'),
	  multerS3 = require('multer-s3');
	  
//const http = require('http').createServer(app);
// const io = require('socket.io')(http, {
// 	cors: {
// 		origins: ['http://localhost:4200']
// 	}
// })

//multer configuration
const upload = multer({
	dest: process.env.TMP_DIR || "/tmp"
  });

const app = express()
const appWS = expressWS(app)

//server configuration setup
const PORT = parseInt(process.argv[2]) || parseInt(process.env.APP_PORT) || 3000
//app.use(express.urlencoded({ extended: true }));
//app.use(express.json());
app.use(bodyparser.urlencoded({limit: '50mb', extended: true}))
app.use(bodyparser.json({limit: '50mb'}))
app.use(morgan('combined'))
app.use(cors())
//--end of server configuration setup

//SQL configuration setup
const pool = mysql.createPool({
	host: process.env.MYSQL_SERVER,
	port: process.env.MYSQL_SVR_PORT,
	user: process.env.MYSQL_USERNAME,
	password: process.env.MYSQL_PASSWORD,
	database: process.env.MYSQL_SCHEMA,
	connectionLimit: process.env.MYSQL_CON_LIMIT
});
const isValidUserSQL = 'SELECT COUNT(*) as "match" from player where player_id = ? AND password = ?';
const insertUserSQL = 'INSERT into player(player_id, password) values(?, ?)';
const insertPlayerStatsSQL = 'INSERT into playerStats(player_id, player_hits, player_misses, player_shots) values(?, ?, ?, ?)';
const selectTopPlayersSQL = 'SELECT * from playerStats order by player_hits desc';

const mkSQLQuery =(sql,pool)=>{
	return async (args) => {
		const conn = await pool.getConnection();
		try {
			const [result, _ ] = await conn.query(sql,args);
			return result;
		}
		catch(e) {
			console.error('ERROR: ', e);
			throw e;
		}
		finally{ 
			conn.release();
		}
	}
}
//--end of SQL configuration setup

//AWS configuration
const AWS_S3_HOSTNAME = process.env.AWS_S3_HOSTNAME;
const AWS_S3_ACCESSKEY_ID= process.env.AWS_S3_ACCESSKEY_ID;
const AWS_S3_SECRET_ACCESSKEY= process.env.AWS_S3_SECRET_ACCESSKEY;
const AWS_S3_BUCKET_NAME=process.env.AWS_S3_BUCKET_NAME;

const spaceEndpoint = new aws.Endpoint(AWS_S3_HOSTNAME);
const s3 = new aws.S3 ({
    endpoint: spaceEndpoint,
    accessKeyId: AWS_S3_ACCESSKEY_ID,
    secretAccessKey: AWS_S3_SECRET_ACCESSKEY
});

//file functions
const readFile = (path) => new Promise(
	(resolve, reject) => 
		fs.readFile(path, (err, buff) => {
			if (null != err)
				reject(err)
			else 
				resolve(buff)
		})
)

//reading and storing into S3
const putObject = (file, buff, s3) => new Promise(
	(resolve, reject) => {
		const params = {
			Bucket: process.env.AWS_S3_BUCKET_NAME,
			Key: file.filename, 
			Body: buff,
			ACL: 'public-read',
			ContentType: file.mimetype,
			ContentLength: file.size
		}
		s3.putObject(params, (err, result) => {
			if (null != err)
				reject(err)
			else
				resolve(result)
		})
	}
)

const getObject = (keyFilename, s3) => new Promise(
	(resolve, reject) => {
		const params = {
			Bucket: process.env.AWS_S3_BUCKET_NAME,
			Key: keyFilename
		}
		s3.getObject(params, function(err,result) {
			if (null !=err)
				reject(err)
			else
				resolve(result)
		});
	}
)

// const upload = multer({
//     storage: multerS3({
//         s3: s3,
//         bucket: AWS_S3_BUCKET_NAME,
//         acl: 'private',
//         metadata: function(req,file,cb) {
//             cb(null, {
//                 fieldName: file.fieldname,
//                 originalFileName: file.originalname,
//                 uploadTimeStamp: new Date().toString()
//             });
//         },
//         key: function (req, file, cb) {
//             console.log("key:"+file);
//             cb(null, new Date().getTime()+'_'+file.originalname);
//         }
//     })
// }).single('upload');

async function downloadFromS3(params, res) {
    const metaData = await s3.headObject(params).promise();
    console.log("metadata");
    console.log(metaData);
    res.set({
        'X-Original-Name': metaData.Metadata.originalFileName,
        'X-Create-Time': metaData.Metadata.uploadTimeStamp
    })
    s3.getObject(params, function(err, data) {
        if(err) console.log(err, err.stack);
        res.send(data.Body);
    });
};
//--end of AWS configuration setup

//Phaser game objects
const players = []
isGameOver = false;
isGameStarted = false;
hasGameToken = ''; //hold playerId to compare for turn to move
//--end of phaser game objects

//Express servers calls - login and signup
app.post('/login', (req,res)=> {
	//console.info(req.body);
	let player_id = req.body.player_id;
	let password = req.body.password;
	//console.info("playerid: ", player_id)
	//console.info("password: ", password)
	//sha1(req.body.password);
	//console.info(req.body.password);
	mkSQLQuery(isValidUserSQL, pool)([player_id, password])
	.then(result=>{
		console.info(result);
		if(result[0]['match'] !== 0) {
			console.info("200");
			res.type('application/json');
			res.status(200);
			//res.json(result);
			res.json({status:"200",message:"login success", 
			player_id: player_id, password: password});
		}
		else {
			console.info("401");
			res.status(401);
			res.json({status:"401",message:"authentication failed"});
		}
	})
	.catch(err=>{
		res.status(500);
		res.json(err);
	})
})

app.post('/signUp', (req,res)=>{
	console.info(req.body);
	let player_id = req.body.player_id;
	let password = req.body.password;
	//sha1(req.body.password);
	//upload image file to S3 first
	readFile(req.file.path)
		.then(buff => {
			//console.log(buff);
			putObject(req.file, buff, s3);
		})
		.then(
			result => {
				mkSQLQuery(insertUserSQL, pool)([player_id, password]);
			}
		)
		.then(
			result=>{
				console.info(result.serverStatus);
				if(result.serverStatus === 2) {
					// console.info("200");
					// res.type('application/json');
					res.status(200);
					res.json({message:"Register success!"});
					// res.json({status:"200",message:"login success", 
					// player_id: player_id, password: password});
				}
				else {
					console.info("401");
					res.status(401);
					res.json({status:"401",message:"sign up failed"});
				}
		})
		.catch(err=>{
			res.status(500);
			res.json({message:"Duplicate ID!"});
		})
		
	// mkSQLQuery(insertUserSQL, pool)([player_id, password])
	// .then(result=>{
	// 	console.info(result.serverStatus);
	// 	if(result.serverStatus === 2) {
	// 		// console.info("200");
	// 		// res.type('application/json');
	// 		res.status(200);
	// 		res.json({message:"Register success!"});
	// 		// res.json({status:"200",message:"login success", 
	// 		// player_id: player_id, password: password});
	// 	}
	// 	else {
	// 		console.info("401");
	// 		res.status(401);
	// 		res.json({status:"401",message:"sign up failed"});
	// 	}
	// })
	// .catch(err=>{
	// 	res.status(500);
	// 	res.json({message:"Duplicate ID!"});
	// })
})
//--end of express server calls for login/signup

//Express server call - retrieve data
app.get('/rankings', (req,res)=> {
	mkSQLQuery(selectTopPlayersSQL, pool)([])
	.then(result=> {
		console.info(result);
		if(result.length){
			res.status(200);
			res.json(result);
		}
		else{
			res.status(401);
			res.json({message:"Rankings retrieve fail!"});
		}	
	})
	.catch(err=>{
		res.status(500);
		res.json({message:"Error retrieving rankings!"});
	})
})

//end game data collection
const insertStatsToRankings = (playerId, matchStats) => {
	mkSQLQuery(insertPlayerStatsSQL, pool)
	([playerId, matchStats.hits, matchStats.misses, matchStats.shots])
	.then(result=>{
		console.info("insert stats...");
		console.info(result.serverStatus);
	})
}

//process websocket calls
const processMessage = (payload) => {
	//console.info("Msg received: ", payload);
	const msg = JSON.parse(payload);
	playerId = '';
	console.info("Msg received: ", msg);
	let resp;
	switch (msg.type) {
		case 'player-ready':
			var isAllPlayersReady = true;
			playerId = msg.player;
			const ship1X = msg.ship1X;
			const ship1Y = msg.ship1Y;
			var playerIdx = players.findIndex(p=> p.playerId == playerId)
			players[playerIdx].isPlayerReady = true;
			players[playerIdx].ship1X = ship1X;
			players[playerIdx].ship1Y = ship1Y;
			//console.info('player-length:',players.length);
			for (let idx = 0; idx < players.length; idx++) {
				if(!(players.length > 1)) {
					console.info("all players ready:", isAllPlayersReady = false);
					resp = { type: 'wait-for-players' };//, message: 'Waiting for players...' };
					players[playerIdx].ws.send(JSON.stringify(resp));
					break;
				}
				else if(!players[idx].isPlayerReady) {
					console.info("all players ready:", isAllPlayersReady = false);
					resp = { type: 'wait-for-players' };//, message: 'Waiting for players...' };
					players[playerIdx].ws.send(JSON.stringify(resp));
					break;
				}
			}
			if(isAllPlayersReady) {
				isGameStarted = true;
				resp = { type: 'all-players-ready' };
				for (let p in players) {
					players[p].ws.send(JSON.stringify(resp));
				}
				hasGameToken = players[0].playerId;
				console.info("current player:", hasGameToken);
				players[0].hasMove = true;
				for (let idx = 0; idx < players.length; idx++) {
					if(idx == 0) {
						console.info('player 0 turn');
						resp = { type: 'player-turn' };
						players[idx].ws.send(JSON.stringify(resp));
					}
					else {
						console.info('player'+idx+' wait');
						resp = { type: 'player-wait' };
						players[idx].ws.send(JSON.stringify(resp));
					}
				}
			}
			break;

		case 'player-end-turn':
			//set player attributes 
			playerId = msg.player;
			console.info("player-end-turn player: ", playerId);
			const bombLoc = msg.bombLoc;
			console.info("player-end-turn bombloc: ", bombLoc);
			var playerIdx = players.findIndex(p=> p.playerId == playerId);
			players[playerIdx].hasMove = false;
			hasGameToken = players[playerIdx].playerId;

			//check ships shots status and end game condition
			for (let i = 0; i < players.length; i++) {
				if(i == playerIdx) {
					console.info("player-end-turn same player found");
					continue;
				}
				else {
					for (let j = 0; j < bombLoc.length; j++) {
						if(bombLoc[j].x == players[i].ship1X && bombLoc[j].y == players[i].ship1Y){
							players[i].ship1Sink = true;
							console.info(players[i].playerId + " ship sank");
							resp = { type: 'self-ship-sinked', sinkLoc: bombLoc[j] };
							players[i].ws.send(JSON.stringify(resp));
							resp = { type: 'enemy-ship-sinked', sinkLoc: bombLoc[j] };
							players[playerIdx].ws.send(JSON.stringify(resp));
							//end game if all ships hit (here we check only one ship)
						}
						else {
							console.info("server - shot missed");
							resp = { type: 'shot-missed' };
							players[playerIdx].ws.send(JSON.stringify(resp));
						}		
					}
				}	
				//check game over conditions
				if(players[i].ship1Sink) {
					this.isGameOver = true;
					resp = { type: 'victory-game-over'};
					players[playerIdx].ws.send(JSON.stringify(resp));
					resp = { type: 'defeat-game-over'};
					players[i].ws.send(JSON.stringify(resp));
				}
			}
			//hand over player turn to next player if game not over
			console.info("game state:", this.isGameOver);
			if(!this.isGameOver) {
				console.info("player-end-turn: game NOT over");
				for(const x in players) {
					if(players[playerIdx].playerId == players[x].playerId) {
						resp = { type: 'player-wait' };
						players[x].ws.send(JSON.stringify(resp));
					} else {
						resp = { type: 'player-turn' };
						players[x].ws.send(JSON.stringify(resp));
					}
				}
			}
			break;
		
		case 'collect-stats': 
			playerId = msg.player;
			const matchStats = msg.stats;
			insertStatsToRankings(playerId, matchStats);
			break;

		default:
	}

}

//websocket calls using expressWS
app.ws('/play/:playerId', (ws,req)=> {
	//console.info("server socket open: ", ws);
	//console.info("server req: ", req);
	const playerId = req.params.playerId;
	console.info("backend player joined: ", playerId);

	players.push({
		playerId, 
		ship1Sink: false, 
		ship1X: 0,
		ship1Y: 0,
		ship2Sink: false, 
		ship3Sink: false,
		isPlayerReady: false,
		hasMove: false,
		ws
	});

	//console.info('>> ', players);

	ws.on('message', processMessage);

	ws.on('close', ()=> {
		console.info('player leaving: ',playerId);
		const playerIdx = players.findIndex(p=> p.playerId == playerId);
		const player = players[playerIdx];
		players.splice(playerIdx, 1);
		player.ws.close();
	})

	const msg = JSON.stringify({
		type: 'player-joined',
		player: playerId
	});
	for (let i = 0; i < players.length; i++) {
		const p = players[i];
		p.ws.send(msg);
	}

})

//socket.io server calls for phaser game and socket
// io.on('connection', (socket)=> {
// 	// let ship1Sink = false
// 	// let ship2Sink = false
// 	// let ship3Sink = false
// 	// const playerSocket = socket.id
// 	console.log('a player connected: ' + socket.id);
// 	// players.push[{playerSocket, ship1Sink, ship2Sink, ship3Sink}]

// 	io.emit('testing');

// 	socket.on('disconnect', ()=> {
// 		console.info('a player disconnected: '+ socket.id);
// 		//remove player from players array
// 	});
// });
//--end of socket.io server calls for phaser game and socket


//Server application setup and initialization
const p0 = (async ()=> {
    const conn = await pool.getConnection()
    await conn.ping()
    conn.release()
    return true
})()

const p1 = new Promise(
	(resolve, reject) => {
		if ((!!process.env.AWS_S3_ACCESSKEY_ID) && (!!process.env.AWS_S3_SECRET_ACCESSKEY))
			resolve()
		else
			reject('S3 keys not found')
	}
)

Promise.all([p0,p1])
.then(()=> {
    app.listen(PORT, () => {
        console.info(`Application started on port ${PORT} at ${new Date()}`)
    })
})
.catch(err=> {console.error('Cannot connect: ', err)})

// http.listen(8080, ()=>{
// 	console.log('http server started');
// })


