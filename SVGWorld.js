var SVGWorld = (function () {
    function SVGWorld(currentState, useSpeech) {
        var _this = this;
        if (useSpeech === void 0) { useSpeech = false; }
        this.currentState = currentState;
        this.useSpeech = useSpeech;
        this.dialogueHistory = 100;
        this.floorThickness = 10;
        this.wallSeparation = 4;
        this.armSize = 0.2;
        this.animationPause = 0.01;
        this.promptPause = 0.5;
        this.ajaxTimeout = 5;
        this.armSpeed = 1000;
        this.voices = {
            system: { lang: "en-GB", rate: 1.1 },
            user: { lang: "en-US" },
        };
        this.containers = {
            world: $('#theworld'),
            dialogue: $('#dialogue'),
            inputform: $('#dialogue form'),
            userinput: $('#dialogue form input:text'),
            inputexamples: $('#dialogue form select'),
        };
        this.svgNS = 'http://www.w3.org/2000/svg';
        this.objectData = { brick: { small: { width: 0.30, height: 0.30 },
                large: { width: 0.70, height: 0.60 } },
            plank: { small: { width: 0.60, height: 0.10 },
                large: { width: 1.00, height: 0.15 } },
            ball: { small: { width: 0.30, height: 0.30 },
                large: { width: 0.70, height: 0.70 } },
            pyramid: { small: { width: 0.60, height: 0.25 },
                large: { width: 1.00, height: 0.40 } },
            box: { small: { width: 0.60, height: 0.30, thickness: 0.10 },
                large: { width: 1.00, height: 0.40, thickness: 0.10 } },
            table: { small: { width: 0.60, height: 0.30, thickness: 0.10 },
                large: { width: 1.00, height: 0.40, thickness: 0.10 } },
        };
        if (!this.currentState.arm)
            this.currentState.arm = 0;
        if (this.currentState.holding)
            this.currentState.holding = null;
        this.canvasWidth = this.containers.world.width() - 2 * this.wallSeparation;
        this.canvasHeight = this.containers.world.height() - this.floorThickness;
        var dropdown = this.containers.inputexamples;
        dropdown.empty();
        dropdown.append($('<option value="">').text("(Select an example utterance)"));
        $.each(this.currentState.examples, function (i, value) {
            dropdown.append($('<option>').text(value));
        });
        dropdown.change(function () {
            var userinput = dropdown.val().trim();
            if (userinput) {
                _this.containers.userinput.val(userinput).focus();
            }
        });
        this.containers.inputform.submit(function () { return _this.handleUserInput.call(_this); });
        this.disableInput();
    }
    SVGWorld.prototype.readUserInput = function (prompt, callback) {
        this.printSystemOutput(prompt);
        this.enableInput();
        this.inputCallback = callback;
    };
    SVGWorld.prototype.printSystemOutput = function (output, participant, utterance) {
        if (participant === void 0) { participant = "system"; }
        if (utterance == undefined) {
            utterance = output;
        }
        var dialogue = this.containers.dialogue;
        if (dialogue.children().length > this.dialogueHistory) {
            dialogue.children().first().remove();
        }
        $('<p>').attr("class", participant)
            .text(output)
            .insertBefore(this.containers.inputform);
        dialogue.scrollTop(dialogue.prop("scrollHeight"));
        if (this.useSpeech && utterance && /^\w/.test(utterance)) {
            try {
                var speech = new SpeechSynthesisUtterance(utterance);
                for (var attr in this.voices[participant]) {
                    speech[attr] = this.voices[participant][attr];
                }
                console.log("SPEAKING: " + utterance);
                window.speechSynthesis.speak(speech);
            }
            catch (err) {
            }
        }
    };
    SVGWorld.prototype.printDebugInfo = function (info) {
        console.log(info);
    };
    SVGWorld.prototype.printError = function (error, message) {
        console.error(error, message);
        if (message) {
            error += ": " + message;
        }
        this.printSystemOutput(error, "error");
    };
    SVGWorld.prototype.printWorld = function (callback) {
        this.containers.world.empty();
        this.printSystemOutput("Please wait while I populate the world.");
        var viewBox = [0, 0, this.canvasWidth + 2 * this.wallSeparation,
            this.canvasHeight + this.floorThickness];
        var svg = $(this.SVG('svg')).attr({
            viewBox: viewBox.join(' '),
            width: viewBox[2],
            height: viewBox[3],
        }).appendTo(this.containers.world);
        $(this.SVG('rect')).attr({
            x: 0,
            y: this.canvasHeight,
            width: this.canvasWidth + 2 * this.wallSeparation,
            height: this.canvasHeight + this.floorThickness,
            fill: 'black',
        }).appendTo(svg);
        $(this.SVG('line')).attr({
            id: 'arm',
            x1: this.stackWidth() / 2,
            y1: this.armSize * this.stackWidth() - this.canvasHeight,
            x2: this.stackWidth() / 2,
            y2: this.armSize * this.stackWidth(),
            stroke: 'black',
            'stroke-width': this.armSize * this.stackWidth(),
        }).appendTo(svg);
        var timeout = 0;
        for (var stacknr = 0; stacknr < this.currentState.stacks.length; stacknr++) {
            for (var objectnr = 0; objectnr < this.currentState.stacks[stacknr].length; objectnr++) {
                var objectid = this.currentState.stacks[stacknr][objectnr];
                this.makeObject(svg, objectid, stacknr, timeout);
                timeout += this.animationPause;
            }
        }
        if (callback) {
            setTimeout(callback, (timeout + this.promptPause) * 1000);
        }
    };
    SVGWorld.prototype.performPlan = function (plan, callback) {
        var _this = this;
        if (this.isSpeaking()) {
            setTimeout(function () { return _this.performPlan(plan, callback); }, this.animationPause * 1000);
            return;
        }
        var planctr = 0;
        var performNextAction = function () {
            planctr++;
            if (plan && plan.length) {
                var item = plan.shift().trim();
                var action = _this.getAction(item);
                if (action) {
                    try {
                        action.call(_this, performNextAction);
                    }
                    catch (err) {
                        _this.printError(err);
                        if (callback)
                            setTimeout(callback, _this.promptPause * 1000);
                    }
                }
                else {
                    if (item && item[0] != "#") {
                        if (_this.isSpeaking()) {
                            plan.unshift(item);
                            setTimeout(performNextAction, _this.animationPause * 1000);
                        }
                        else {
                            _this.printSystemOutput(item);
                            performNextAction();
                        }
                    }
                    else {
                        performNextAction();
                    }
                }
            }
            else {
                if (callback)
                    setTimeout(callback, _this.promptPause * 1000);
            }
        };
        performNextAction();
    };
    SVGWorld.prototype.stackWidth = function () {
        return this.canvasWidth / this.currentState.stacks.length;
    };
    SVGWorld.prototype.boxSpacing = function () {
        return Math.min(5, this.stackWidth() / 20);
    };
    SVGWorld.prototype.SVG = function (tag) {
        return document.createElementNS(this.svgNS, tag);
    };
    SVGWorld.prototype.animateMotion = function (object, path, timeout, duration) {
        var animation = this.SVG('animateMotion');
        $(animation).attr({
            begin: 'indefinite',
            fill: 'freeze',
            path: path.join(" "),
            dur: duration + "s",
        }).appendTo(object);
        animation.beginElementAt(timeout);
        return animation;
    };
    SVGWorld.prototype.getAction = function (act) {
        var actions = { p: this.pick, d: this.drop, l: this.left, r: this.right };
        return actions[act.toLowerCase()];
    };
    SVGWorld.prototype.left = function (callback) {
        if (this.currentState.arm <= 0) {
            throw "Already at left edge!";
        }
        this.horizontalMove(this.currentState.arm - 1, callback);
    };
    SVGWorld.prototype.right = function (callback) {
        if (this.currentState.arm >= this.currentState.stacks.length - 1) {
            throw "Already at right edge!";
        }
        this.horizontalMove(this.currentState.arm + 1, callback);
    };
    SVGWorld.prototype.drop = function (callback) {
        if (!this.currentState.holding) {
            throw "Not holding anything!";
        }
        this.verticalMove('drop', callback);
        this.currentState.stacks[this.currentState.arm].push(this.currentState.holding);
        this.currentState.holding = null;
    };
    SVGWorld.prototype.pick = function (callback) {
        if (this.currentState.holding) {
            throw "Already holding something!";
        }
        this.currentState.holding = this.currentState.stacks[this.currentState.arm].pop();
        this.verticalMove('pick', callback);
    };
    SVGWorld.prototype.horizontalMove = function (newArm, callback) {
        var xArm = this.currentState.arm * this.stackWidth() + this.wallSeparation;
        var xNewArm = newArm * this.stackWidth() + this.wallSeparation;
        var path1 = ["M", xArm, 0, "H", xNewArm];
        var duration = Math.abs(xNewArm - xArm) / this.armSpeed;
        var arm = $('#arm');
        this.animateMotion(arm, path1, 0, duration);
        if (this.currentState.holding) {
            var objectHeight = this.getObjectDimensions(this.currentState.holding).heightadd;
            var yArm = -(this.canvasHeight - this.armSize * this.stackWidth() - objectHeight);
            var path2 = ["M", xArm, yArm, "H", xNewArm];
            var object = $("#" + this.currentState.holding);
            this.animateMotion(object, path2, 0, duration);
        }
        this.currentState.arm = newArm;
        if (callback)
            setTimeout(callback, (duration + this.animationPause) * 1000);
    };
    SVGWorld.prototype.verticalMove = function (action, callback) {
        var altitude = this.getAltitude(this.currentState.arm);
        var objectHeight = this.getObjectDimensions(this.currentState.holding).heightadd;
        var yArm = this.canvasHeight - altitude - this.armSize * this.stackWidth() - objectHeight;
        var yStack = -altitude;
        var xArm = this.currentState.arm * this.stackWidth() + this.wallSeparation;
        var path1 = ["M", xArm, 0, "V", yArm];
        var path2 = ["M", xArm, yArm, "V", 0];
        var duration = (Math.abs(yArm)) / this.armSpeed;
        var arm = $('#arm');
        var object = $("#" + this.currentState.holding);
        this.animateMotion(arm, path1, 0, duration);
        this.animateMotion(arm, path2, duration + this.animationPause, duration);
        if (action == 'pick') {
            var path3 = ["M", xArm, yStack, "V", yStack - yArm];
            this.animateMotion(object, path3, duration + this.animationPause, duration);
        }
        else {
            var path3 = ["M", xArm, yStack - yArm, "V", yStack];
            this.animateMotion(object, path3, 0, duration);
        }
        if (callback)
            setTimeout(callback, 2 * (duration + this.animationPause) * 1000);
    };
    SVGWorld.prototype.getObjectDimensions = function (objectid) {
        var attrs = this.currentState.objects[objectid];
        var size = this.objectData[attrs.form][attrs.size];
        var width = size.width * (this.stackWidth() - this.boxSpacing());
        var height = size.height * (this.stackWidth() - this.boxSpacing());
        var thickness = size.thickness * (this.stackWidth() - this.boxSpacing());
        var heightadd = attrs.form == 'box' ? thickness : height;
        return {
            width: width,
            height: height,
            heightadd: heightadd,
            thickness: thickness,
        };
    };
    SVGWorld.prototype.getAltitude = function (stacknr, objectid) {
        var stack = this.currentState.stacks[stacknr];
        var altitude = 0;
        for (var i = 0; i < stack.length; i++) {
            if (objectid == stack[i])
                break;
            altitude += this.getObjectDimensions(stack[i]).heightadd + this.boxSpacing();
        }
        return altitude;
    };
    SVGWorld.prototype.makeObject = function (svg, objectid, stacknr, timeout) {
        var attrs = this.currentState.objects[objectid];
        var altitude = this.getAltitude(stacknr, objectid);
        var dim = this.getObjectDimensions(objectid);
        var ybottom = this.canvasHeight - this.boxSpacing();
        var ytop = ybottom - dim.height;
        var ycenter = (ybottom + ytop) / 2;
        var yradius = (ybottom - ytop) / 2;
        var xleft = (this.stackWidth() - dim.width) / 2;
        var xright = xleft + dim.width;
        var xcenter = (xright + xleft) / 2;
        var xradius = (xright - xleft) / 2;
        var xmidleft = (xcenter + xleft) / 2;
        var xmidright = (xcenter + xright) / 2;
        var object;
        switch (attrs.form) {
            case 'brick':
            case 'plank':
                object = $(this.SVG('rect')).attr({
                    x: xleft,
                    y: ytop,
                    width: dim.width,
                    height: dim.height
                });
                break;
            case 'ball':
                object = $(this.SVG('ellipse')).attr({
                    cx: xcenter,
                    cy: ycenter,
                    rx: xradius,
                    ry: yradius
                });
                break;
            case 'pyramid':
                var points = [xleft, ybottom, xmidleft, ytop, xmidright, ytop, xright, ybottom];
                object = $(this.SVG('polygon')).attr({
                    points: points.join(" ")
                });
                break;
            case 'box':
                var points = [xleft, ytop, xleft, ybottom, xright, ybottom, xright, ytop,
                    xright - dim.thickness, ytop, xright - dim.thickness, ybottom - dim.thickness,
                    xleft + dim.thickness, ybottom - dim.thickness, xleft + dim.thickness, ytop];
                object = $(this.SVG('polygon')).attr({
                    points: points.join(" ")
                });
                break;
            case 'table':
                var points = [xleft, ytop, xright, ytop, xright, ytop + dim.thickness,
                    xmidright, ytop + dim.thickness, xmidright, ybottom,
                    xmidright - dim.thickness, ybottom, xmidright - dim.thickness, ytop + dim.thickness,
                    xmidleft + dim.thickness, ytop + dim.thickness, xmidleft + dim.thickness, ybottom,
                    xmidleft, ybottom, xmidleft, ytop + dim.thickness, xleft, ytop + dim.thickness];
                object = $(this.SVG('polygon')).attr({
                    points: points.join(" ")
                });
                break;
        }
        object.attr({
            id: objectid,
            stroke: 'black',
            'stroke-width': this.boxSpacing() / 2,
            fill: attrs.color,
        });
        object.appendTo(svg);
        var path = ["M", stacknr * this.stackWidth() + this.wallSeparation,
            -(this.canvasHeight + this.floorThickness)];
        this.animateMotion(object, path, 0, 0);
        path.push("V", -altitude);
        this.animateMotion(object, path, timeout, 0.5);
    };
    SVGWorld.prototype.enableInput = function () {
        this.containers.inputexamples.prop('disabled', false).val('');
        this.containers.inputexamples.find("option:first").attr('selected', 'selected');
        this.containers.userinput.prop('disabled', false);
        this.containers.userinput.focus().select();
    };
    SVGWorld.prototype.disableInput = function () {
        this.containers.inputexamples.blur();
        this.containers.inputexamples.prop('disabled', true);
        this.containers.userinput.blur();
        this.containers.userinput.prop('disabled', true);
    };
    SVGWorld.prototype.handleUserInput = function () {
        var userinput = this.containers.userinput.val().trim();
        this.disableInput();
        this.printSystemOutput(userinput, "user");
        this.inputCallback(userinput);
        return false;
    };
    SVGWorld.prototype.isSpeaking = function () {
        return this.useSpeech && window && window.speechSynthesis && window.speechSynthesis.speaking;
    };
    return SVGWorld;
}());
