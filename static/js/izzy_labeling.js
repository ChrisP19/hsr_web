var imgcanvas = document.getElementById("imgcanvas");
var bboxcanvas = document.getElementById("bboxcanvas");

// canvas.style.visibility = "visible";

// addr = '128.32.37.232'
addr = '0.0.0.0'

var imgctx = imgcanvas.getContext("2d");
var ctx = bboxcanvas.getContext("2d");

imgcanvas.width = 420;
imgcanvas.height = 420;
bboxcanvas.width = 420;
bboxcanvas.height = 420;

workerID = psiTurk.taskdata.get('workerId')
console.log(psiTurk)

// Background image
var bgImage = new Image();
// bgImage.src = "static/images/background.jpg"
bgImage.onload = function () {
	imgctx.drawImage(bgImage, 0, 0, 420, 420);
}

// Handle keyboard controls
var keysDown = {};

//bounding boxes
curr_boxes = [];
drawing = false;

//labels to html
labels = ["oatmeal", "mustard", "syrup", "mayonnaise", "salad dressing"];
var labelHTML = "";
for (i = 0; i < labels.length; i += 1) {
	labelHTML += "<button class='dropmenu-btn' id='drop" + i + "'>" + labels[i] + "</button>\n"
}
document.getElementById("labelmenu").innerHTML = labelHTML;

hotkeys = ["q", "w", "e", "r", "t"]

update_label(labels[0]);
colors = ['#FF0000', '#0000FF', '#00FFFF', '#00FF00', '#000000'];
color_ind = 0;

addEventListener("keydown", function (e) {
	for (i = 0; i < hotkeys.length; i++) {
		//32 offset??
		if (e.keyCode == hotkeys[i].charCodeAt(0) - 32) {
			update_label(labels[i]);
		}
	}
	if (e.keyCode == "n".charCodeAt(0) - 32) {
		updateData("next");
		updateImg("next");
	}
	if (e.keyCode == "p".charCodeAt(0) - 32) {
		updateData("prev");
		updateImg("prev");
	}
	esc_code = 27
	if (e.keyCode == 27) {
		drawing = false;
	}
}, false);

addEventListener("mousedown", function (e) {
	pos = mouseToPos(e.clientX, e.clientY);
	if (pos) {
		if (drawing){
			//record the bounding box
			x1 = Math.min(old_pose[0], curr_pose[0]);
			x2 = Math.max(old_pose[0], curr_pose[0]);
			y1 = Math.min(old_pose[1], curr_pose[1]);
			y2 = Math.max(old_pose[1], curr_pose[1]);

			addBbox([x1, y1, x2, y2], curr_label);
			drawing = false;
		}
		else {
			drawing = true;
			curr_pose = pos;
			old_pose = pos;
		}
	}
}, false);

function addBbox(bounds, label) {
	c = colors[color_ind];
	color_ind += 1;
	color_ind = color_ind % colors.length;
	x1 = bounds[0]
	y1 = bounds[1]
	x2 = bounds[2]
	y2 = bounds[3]

	curr_boxes.push([[[x1, y1], [x2, y2]], c, label]);

	var table = document.getElementById("boxinfo");
	var row = table.insertRow(-1);
	var cell = row.insertCell(0);
	var deleteBut = row.insertCell(1);
	deleteBut.innerHTML = "<button type='button'>Delete</button>";
	deleteBut.onclick = function() {
		var table = document.getElementById("boxinfo");
		var ind = this.parentNode.rowIndex;
		table.deleteRow(ind);
		curr_boxes.splice(ind, 1);
	}
	cell.innerHTML = label + ": (" + x1 + "," + y1 + ") -> (" + x2 + "," + y2 + ")";
	cell.style.color = c;
}

addEventListener("mousemove", function (e) {
	curr_pose = mouseToPos(e.clientX, e.clientY)
}, false);

function clearData() {
	curr_boxes = [];
	var table = document.getElementById("boxinfo");
	table.innerHTML = "";
	color_ind = 0;
}

document.getElementById('clear').onclick = function() {
	clearData();
};

document.getElementById('next').onclick = function() {
	updateData("next");
	updateImg("next");
};
document.getElementById('prev').onclick = function() {
	updateData("prev");
	updateImg("prev");
};

function update_label(label_val) {
	curr_label = label_val;
	document.getElementById("clabel").innerHTML = curr_label;
}

function fixClosure(val) {
	return function() {
		update_label(val);
	}
}
for (j=0; j<labels.length; j++) {
	document.getElementById('drop' + j).onclick = fixClosure(labels[j]);
}


var mouseToPos = function(x, y){
	var rect = bboxcanvas.getBoundingClientRect();
	return (x < rect.left || x > rect.right || y > rect.bottom || y < rect.top) ? false : [x - rect.left, y - rect.top];
}


function updateData(direction) {
	feedback = []
	feedback.push({
		key: "dir",
		value: direction
	})
	for (i = 0; i < curr_boxes.length; i += 1) {
		datapoint = curr_boxes[i]
		coords = datapoint[0]
		label = datapoint[2]
		feedback.push({
			key: "coords",
			value: coords
		})
		feedback.push({
			key: "label",
			value: label
		})
		feedback.push({
			key: "wID",
			value: workerID
		})
	}
	clearData();

	$.ajax('http://'+addr+':5000/state_feed', {
        type: "GET",
        data: feedback,
		success: function( response ) {
		    load_data = response.next_data
			if (load_data != -1) {
				for (i = 0; i < load_data.length; i += 1) {
					label = load_data[i][1]
					bbox = load_data[i][0].split(",")
					for (j = 0; j < bbox.length; j += 1) {
						bbox[j] = +bbox[j];
					}
					addBbox([bbox[0], bbox[1], bbox[2], bbox[3]], label);
				}
			}
		}
    });
};

function updateImg(direction) {
	bgImage.src = 'http://' + addr + ':5000/image_' + direction + '/' + workerID
}

function drawBox(poses)
{
	p1 = poses[0];
	p2 = poses[1];
	ctx.beginPath();
	ctx.moveTo(p1[0], p1[1]);
	ctx.lineTo(p1[0], p2[1]);
	ctx.lineTo(p2[0], p2[1]);
	ctx.lineTo(p2[0], p1[1]);
	ctx.lineTo(p1[0], p1[1]);
	ctx.lineWidth = 3;
	ctx.stroke();
}

// Draw everything
var render = function () {
	ctx.clearRect(0, 0, bboxcanvas.width, bboxcanvas.height);
	for (var i = 0; i < curr_boxes.length; i++) {
		ctx.strokeStyle =  curr_boxes[i][1];
		drawBox(curr_boxes[i][0]);
	}
	if (drawing){
		ctx.strokeStyle = colors[color_ind];
		drawBox([old_pose, curr_pose]);
	}
};

var main = function () {
	requestAnimationFrame(main);
	render();
};

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;
var then = Date.now();
//load labels
function getTextFile(path) {
    var request = new XMLHttpRequest();
    request.open("GET", path, false);
    request.send(null);
    var returnValue = request.responseText;
    return returnValue;
}

//start up
updateData("start");
updateImg("start");
main();
