// New Peer
var peer = new Peer(undefined, {
	path: '/peerjs',
	host: '/',
	port: '30000'
});

// const notifChat = document.getElementById("notif_chat");
// const notifJoin = document.getElementById("notif_join");
// const notifPermission = document.getElementById("notif_permission");
const muteButton = document.getElementById("mute_toggle");
const speakerButton = document.getElementById("speaker_toggle");
// Initialising socket
const socket = io("/", {
	reconnect: false,
});

//...............................
const vidgrid = document.getElementById('vidgrid')
const myvid = document.createElement('video')
navigator.mediaDevices.getUserMedia({
	video: true,
	audio: true
}).then(stream => {
	myvidS = stream;
	addVidS(myvid, stream);

	peer.on('call', function (call) {
		// Answer the call, providing our mediaStream
		call.answer(stream);
		const video = document.createElement('video')
		call.on('stream', userVideoStream => {
			addVidS(video, userVideoStream)
		})
	});
	//oops
	socket.on('user-connected', (userid) => {
		connectNewuser(userid, stream);
	})
})
//oops

peer.on('open', id => {
	socket.emit('join-room', roomno, id);//calls that socket.on func from server.js
})
let myPeerId;
peer.on("open", (id) => {
	myPeerId = id;
});
const peers = {};
connectNewuser = (userid, stream) => {
	console.log("new user connected!", userid)
	//calling the newly connected user!
	const call = peer.call(userid, stream) //calls the connected user
	const video = document.createElement('video')
	call.on('stream', userVideoStream => {
		addVidS(video, userVideoStream)
	})
	call.on('close', () => {
	  video.remove();
	});
	peers[userid] = call;

}

addVidS = (video, stream) => {
	video.srcObject = stream;
	video.addEventListener('loadedmetadata', () => {
		video.play();
	})
	vidgrid.append(video)

} // a func to add a vid stream


function muteToggle() {
		const enabled = myvidS.getAudioTracks()[0].enabled;
		if (enabled) {
			myvidS.getAudioTracks()[0].enabled = false;
			setUnmuteButton();
		} else {
			setMuteButton();
			myvidS.getAudioTracks()[0].enabled = true;
		}
	}

function speakerToggle() {
		console.log('object')
		let enabled = myvidS.getVideoTracks()[0].enabled;
		if (enabled) {
			myvidS.getVideoTracks()[0].enabled = false;
			setPlayVideo()
		} else {
			setStopVideo()
			myvidS.getVideoTracks()[0].enabled = true;
		}
	}
const setMuteButton = () => {
	const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span> `
	document.querySelector('.main_mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
	const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span> `
	document.querySelector('.main_mute_button').innerHTML = html;
}

const setStopVideo = () => {
	const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span> `
	document.querySelector('.main_video_button').innerHTML = html;
}

const setPlayVideo = () => {
	const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
	document.querySelector('.main_video_button').innerHTML = html;
}
//...............................

let curr_socketId;
let areYouHost = false;

// Getting roomno from URL
let temp_arr = window.location.pathname.split("/");
var roomno = temp_arr[temp_arr.length - 1];

// Getting username from URL
var current_username = new URLSearchParams(window.location.search).get(
	"username"
);

socket.on("connect", () => {
	curr_socketId = socket.id;

	//Asking permission to enter the room
	socket.emit("ask permission", roomno, current_username);
});

/* peer connection for audio chat */


//Confirming on leaving/reloading the page
window.onbeforeunload = () => {
	return "Are you sure?";
};

// Buildig room URL for copy link button
const { protocol, host, pathname } = window.location;
let room_URL = `${protocol}//${host}${pathname}`

document.getElementById("userDetail").innerText = current_username;

const navbarToggle = document.getElementsByClassName("navbar-toggler")[0];

// Room does not exist
socket.on("room does not exist", () => {
	window.location.href = "/";
});

// Listenting for host reply
socket.on("enter room", (isAllowed) => {
	// allowed to enter the room
	if (isAllowed) {
		socket.emit("joinroom", roomno, current_username, myPeerId);
		document.getElementById("spinner").remove();
		document.getElementById("body-content").removeAttribute("hidden");
		document.getElementsByTagName("footer")[0].removeAttribute("hidden");
	}
	// not allowed to enter the room
	else window.location.href = "/";
});

//audio
// let streamObj;
// let audioTracks = [];
// navigator.mediaDevices
// 	.getUserMedia({
// 		audio: true,
// 	})
// 	.then((stream) => {
// 		streamObj = stream;
// 		peer.on("call", (call) => {
	// 		call.answer(stream);
	// 		const newAudio = document.createElement("audio");
	// 		call.on("stream", (userAudioStream) => {
	// 			addAudioStream(newAudio, userAudioStream);
	// 		});
	// 	});

	// 	//Notification on new user entry and add audio stream
	// 	socket.on("new user", (username, peerId) => {
	// 		// notifJoin.play();
	// 		toastUserAddRemove(username, "joined");
	// 		console.log(peerId);
	// 		connectToNewUser(peerId, stream);
	// 	});
	// });

// function connectToNewUser(userId, stream) {
// 	const call = peer.call(userId, stream);
// 	const audio = document.createElement("audio");
// 	call.on("stream", (userAudioStream) => {
// 		addAudioStream(audio, userAudioStream);
// 	});
// 	call.on("close", () => {
// 		audio.remove();
// 	});

// 	peers[userId] = call;
// }

// function addAudioStream(audio, stream) {
// 	audio.srcObject = stream;
// 	audio.addEventListener("loadedmetadata", () => {
// 		audio.play();
// 		audio.muted = !isSpeakerOn;
// 	});
// 	audioTracks.push(audio);
// }






// Array to hold the pending permission of user to enter the room
askingPermissionUsers = [];

// Utility function to emit accept/deny permission
// then delete the permission
// and check for new permission
function permissionSpliceAndCheckPermission(isAllowed) {
	socket.emit("isAllowed", roomno, isAllowed, askingPermissionUsers[0].socketId);
	askingPermissionUsers.splice(0, 1);
	if (askingPermissionUsers.length !== 0) {
		setTimeout(() => {
			Utility();
		}, 500);
	}
}

// Decline new user from entering the room
document.getElementById("decline-btn").onclick = () => {
	permissionSpliceAndCheckPermission(false);
};

// Accept new user into the room
document.getElementById("accept-btn").onclick = () => {
	permissionSpliceAndCheckPermission(true);
};

// New user permission
socket.on("user permission", (username, socketId) => {
	// notifPermission.play();
	askingPermissionUsers.push({ username, socketId });
	setTimeout(() => {
		Utility();
	}, 500);
});

// Modal displayed to ask permission from host
function Utility() {
	document.getElementById(
		"modal-body"
	).innerText = `${askingPermissionUsers[0].username} wants to join the room`;

	$("#exampleModal").modal({
		backdrop: "static",
		keyboard: false,
	});
	$("#exampleModal").modal("show");
}

// Sync video
socket.on("get time from host", (socketId) => {
	socket.emit(
		"video current state",
		video.currentTime,
		!video.paused,
		socketId
	);
});

//Function to manually sync
function syncVideo() {
	socket.emit("sync video");
	if (window.innerWidth < 995) navbarToggle.click();
}

//Function to change host
function makeMeHost() {
	socket.emit("make me host");
	if (window.innerWidth < 995) navbarToggle.click();
}

//Copy Link button functionality to share link
function copyLink() {
	let para = document.createElement("textarea");
	para.id = "copiedLink";
	para.value = room_URL;
	document.body.appendChild(para);
	let ele = document.getElementById("copiedLink");
	ele.select();
	document.execCommand("copy");
	document.body.removeChild(para);
	if (window.innerWidth < 995) navbarToggle.click();
}

let URL = window.URL || window.webkitURL;

//Initialising Player
const video_HTML = document.getElementById("video");

//Choose File button implementation
const addVideoFile = function (_event) {
	let file = this.files[0];
	let fileURL = URL.createObjectURL(file);
	document.getElementById("video").src = fileURL;
	if (!areYouHost) syncVideo();
};

//Choose File and Caption button implementation
const addCaptionFile = function (_event) {
	let file = this.files[0];
	let fileURL = URL.createObjectURL(file);
	document.getElementById("video_track").setAttribute("src", fileURL);
};

document
	.getElementById("video_input")
	.addEventListener("change", addVideoFile, false);
document
	.getElementById("caption_input")
	.addEventListener("change", addCaptionFile);

// play event
video.onplaying = (event) => {
	if (areYouHost) {
		socket.emit("play", roomno);
		socket.emit("seeked", video.currentTime, roomno);
	}
};

// pause event
video.onpause = (event) => {
	if (areYouHost) {
		socket.emit("pause", roomno);
	}
};

// seeking event
video.onseeked = (event) => {
	if (areYouHost) {
		let was_video_playing = !video.paused;
		socket.emit("seeked", video.currentTime, roomno);
		if (was_video_playing) socket.emit("play", roomno);
	}
};

//Play video
socket.on("play", () => {
	video.play();
});

//Pause video
socket.on("pause", () => {
	video.pause();
});

//Seek Video
socket.on("seeked", (data) => {
	let was_video_playing = !video.paused;
	video.currentTime = data;
	if (was_video_playing) video.play();
});

//List the members present in the room
socket.on("user_array", (user_array) => {
	// Getting the array of users in room
	document.getElementById("no_of_members").innerText = user_array.length;
	let sidePanel = document.getElementById("sidePanel");
	sidePanel.innerHTML = "";
	user_array.map((users) => {
		let a_tag = document.createElement("a");
		let node = document.createTextNode(users);
		a_tag.classList.add("dropdown-item");
		a_tag.style.color = "white";
		a_tag.style.backgroundColor = "transparent";
		a_tag.style.opacity = "1";
		a_tag.appendChild(node);
		sidePanel.appendChild(a_tag);
	});
});

//Detail about the host of the room
socket.on("current host", (username, hostID) => {
	if (curr_socketId == hostID) areYouHost = true;
	else areYouHost = false;
	document.getElementById("hostDetail").innerText = username;
});

//Chat Implementation
const inputField = document.getElementById("inputField");
const sendMessageButton = document.getElementById("sendbutton");
let chatPanel = document.getElementById("chatpanel");
let chatIsHidden = true;
let chatButton = document.getElementById("chat_button");
let videoCol = document.getElementById("videoCol");
let chatCol = document.getElementById("chatCol");
const chatbody = document.getElementById("chatbody");

//Check whether message input field is empty and disable button accordingly
function checkempty() {
	if (inputField.value.trim() == "") {
		sendMessageButton.disabled = true;
	} else {
		sendMessageButton.disabled = false;
	}
}

//Function to handle messaging
function sendmessage() {
	chatbody.innerHTML += `
	<div class="col-sm-12 my-auto">
			<div
				class="float-right p-2 mt-2"
				style="
					background-color: #343a40;
					color: white;
					border-radius: 15px 15px 0px 15px;
					max-width: 200px;
					min-width: 100px;
				"
			>
				<div class="float-left">
					<b>You</b>
                </div>
            </br>
				<div>${inputField.value}</div>
				<div class="float-right">${new moment().format("h:mm a")}</div>
			</div>
		</div>`;

	socket.emit("New Message", inputField.value, current_username, roomno);
	let objDiv = chatPanel;
	objDiv.scrollTop = objDiv.scrollHeight;
	inputField.value = "";
	sendMessageButton.disabled = true;
}

socket.on("New Message", (message, username) => {
	// if (chatIsHidden) notifChat.play();
	chatbody.innerHTML += `
		<div class="col-sm-12 my-auto">
			<div
				class="float-left p-2 mt-2"
				style="
					background-color: #c0c0c0;
					color: #000000;
					border-radius: 15px 15px 15px 0px;
					max-width: 200px;
					min-width: 100px;
				"
			>
                <div class="float-left"><b>${username}</b></div>
                </br>
				<div class="mt-1">${message}</div>
				<div class="float-right">${new moment().format("h:mm a")}</div>
			</div>
		</div>`;

	let objDiv = chatPanel;
	objDiv.scrollTop = objDiv.scrollHeight;
	let x = document.getElementById("chatRoom");
	if (chatIsHidden == true) {
		chatButton.style.backgroundColor = "#181a1b";
		if (!chatButton.innerHTML.endsWith("*")) chatButton.innerHTML += "*";
	}
});

function chatToggle() {
	setTimeout(() => {
		if (chatIsHidden) {
			chatCol.removeAttribute("hidden");
			chatIsHidden = false;
		} else {
			chatIsHidden = true;
		}
	}, 400);

	if (chatIsHidden) {
		chatButton.style.backgroundColor = "transparent";
		chatButton.innerHTML = chatButton.innerHTML.replace("*", "");
		videoCol.classList.remove("col-md-12");
		videoCol.classList.add("col-md-8");
	} else {
		chatButton.style.backgroundColor = "rgb(25,127,127)";
		videoCol.classList.remove("col-md-8");
		videoCol.classList.add("col-md-12");
		chatCol.setAttribute("hidden", "hidden");
	}
}

function chatRoom() {
	chatToggle();
	if (window.innerWidth < 995) navbarToggle.click();
}
//Handling Notification Events
let toastContainer = document.getElementById("toast-container");

//Notification on user leaving room
socket.on("left room", (username, peerId) => {
	if (peers[peerId]) peers[peerId].close();
	toastUserAddRemove(username, "left");
});

//Function to handle notification events
function toastUserAddRemove(username, eventHappened) {
	toastContainer.style.padding = "10px";
	toastContainer.style.backgroundColor = "#181a1b";
	toastContainer.style.opacity = "0.8";
	toastContainer.style.borderRadius = "8px";
	toastContainer.innerHTML += `<div class="toast" data-autohide="false">
					<div class="toast-header">
						<svg
							class="rounded mr-2 ml-2"
							width="20"
							height="20"
							xmlns="http://www.w3.org/2000/svg"
							preserveAspectRatio="xMidYMid slice"
							focusable="false"
							role="img"
						>
							<rect fill="#007aff" width="100%" height="100%" />
						</svg>
						<strong class="mr-auto" style="color:white">Notification</strong>
					</div>
					<div class="toast-body ml-2 mb-3" style="color:white">
						${username} has ${eventHappened} the room.
					</div>
				</div>`;
	setTimeout(() => {
		toastContainer.innerHTML = "";
		toastContainer.style.padding = "0px";
	}, 5000);
}

//Send Message on pressing enter key
document.onkeypress = function (e) {
	if (e.keyCode == 13 && inputField.value.trim() != "") {
		sendMessageButton.onclick();
	}
};
