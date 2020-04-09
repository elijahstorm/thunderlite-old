function Dialog_Class(canvas)
{
	let Cur_Drawing_Dialog = false;
	let abrupt_finish = false;
	let Display_Prompt_In = false;
	let Queued_Speakers = [];
	let Queued_Texts = [];
	let OverlayBtn;
	this.canvas = canvas;
	let disp_X = INTERFACE.IS_MOBILE_GAME ? 10 : 30,
		disp_Y = INTERFACE.IS_MOBILE_GAME ? 30 : 40,
		disp_W = INTERFACE.IS_MOBILE_GAME ? 500 : 500,
		disp_H = INTERFACE.IS_MOBILE_GAME ? 100 : 115,
		maxTextWidth = INTERFACE.IS_MOBILE_GAME ? 35 : 45,
		maxTextHeight = INTERFACE.IS_MOBILE_GAME ? 150 : 200,
		fontTextSize = INTERFACE.IS_MOBILE_GAME ? 12 : 19 + "pt Times New Roman",
		Slide_Distance = INTERFACE.IS_MOBILE_GAME ? 100 : 200,
		Slide_Rate = 7;

	function Draw(text,speaker,index,newlines,lastLines)
	{
		with(canvas)
		{
			clearRect(0,0,1000,1000);
			fillStyle = "blue";
			globalAlpha = 0.75;
			fillRect(disp_X,disp_Y,disp_W,disp_H);
			fillRect(disp_X+30,disp_Y-30,150,30);
			globalAlpha = 1;
			strokeStyle = "turquoise";
			strokeRect(disp_X,disp_Y,disp_W,disp_H);
			strokeRect(disp_X+30,disp_Y-30,150,30);
			font = "20pt Times New Roman";
			fillStyle = "white";
			fillText(speaker,disp_X+35,disp_Y-5);
			font = fontTextSize;
		}
		if(index==null)
		{
			if(Cur_Drawing_Dialog)
			{
				console.error("Cannot display two dialogs at once");
				return;
			}
			abrupt_finish = false;
			Cur_Drawing_Dialog = true;
			index = 1;
			newlines = 0;
			lastLines = new Array();
			if(text.length>maxTextHeight)
			{ // to fix texts that would overflow
				var i = maxTextHeight-20,
					found = false;
				for(;i<text.length&&i<=maxTextHeight;i++)
				{
					if(text[i]==' '||text[i]=='\n')
					{
						found = true;
						break;
					}
				}
				if(found)
				{
					Queue_At_Start(text.substring(i+1,text.length));
					Queue_Speaker_At_Start(speaker);
					text = text.substring(0,i)+'...';
				}
				else
				{
					Queue_At_Start(text.substring(maxTextHeight,text.length));
					Queue_Speaker_At_Start(speaker);
					text = text.substring(0,maxTextHeight)+'...';
				}
			}
			for(var i=0,last_newline=0;i<text.length;i++)
			{ // to allow tabs to display in canvas editor
				if(text[i]=='\t')
				{
					text = text.substring(0,i)+'    '+text.substring(i+1,text.length);
					i+=4;
					continue;
				}
				if(text[i]=='\n')
				{
					last_newline = i;
				}
				if(i-last_newline>maxTextWidth)
				{
					var j=i,found = false;
					for(;j<text.length&&j-i<=15;j++)
					{
						if(text[j]==' '||text[j]=='\n')
						{
							found = true;
							break;
						}
					}
					if(found)
					{
						text = text.substring(0,j)+'\n'+text.substring(j+1,text.length);
						last_newline = j;
						i = j;
					}
					else
					{
						text = text.substring(0,i)+'\n'+text.substring(i,text.length);
						last_newline = i++;
					}
				}
			}
		}
		while(text[index]==' ')
			index++;
		if(!abrupt_finish)
		{
			with(canvas)
			{
				fillStyle = "white";
				for(let __i=0;__i<lastLines.length;__i++)
				{
					fillText(lastLines[__i],disp_X+10,disp_Y+(25*__i)+20);
				}
				fillText(text.substring(0,index),disp_X+10,disp_Y+newlines+20);
			}
		}
		else
		{
			var loc = text.indexOf('\n');
			index = 0;
			canvas.fillStyle = "white";
			while(loc!=-1)
			{
				var line = text.substring(0,loc);
				canvas.fillText(line,disp_X+10,disp_Y+newlines+20);
				newlines+=25;
				text = text.substring(loc+1,text.length);
				loc = text.indexOf('\n');
			}
			with(canvas)
			{
				for(let __i=0;__i<lastLines.length;__i++)
				{
					fillText(lastLines[__i],disp_X+10,disp_Y+(25*__i)+20);
				}
				fillText(text,disp_X+10,disp_Y+newlines+20);
			}
			Cur_Drawing_Dialog = false;
			return;
		}
		if(index==text.length)
		{
			Cur_Drawing_Dialog = false;
			return;
		}
		if(text[index]=='\n')
		{
			lastLines.push(text.substring(0, index));
			text = text.substring(index+1, text.length);
			index = 0;
			newlines+=25;
		}
		setTimeout(function(){Draw(text,speaker,index+1,newlines,lastLines);},25);
	}
	function Slide_In(text,speaker,i)
	{
		Display_Prompt_In = true;
		with(canvas)
		{
			clearRect(0,0,1000,1000);
			fillStyle = "blue";
			globalAlpha = 0.75;
			fillRect(disp_X,disp_Y+i,disp_W,disp_H);
			fillRect(disp_X+30,disp_Y-30+i,150,30);
			globalAlpha = 1;
			strokeStyle = "turquoise";
			strokeRect(disp_X,disp_Y+i,disp_W,disp_H);
			strokeRect(disp_X+30,disp_Y-30+i,150,30);
		}
		if(i>=0)
		{
			Draw(text,speaker);
			OverlayBtn = INTERFACE.Clickable.Add_Button(INTERFACE.Clickable.Overlay,function(){
				Dialog.Next();
			},"Next Overlay");
			return;
		}
		setTimeout(function(){Slide_In(text,speaker,i+=Slide_Rate);},15);
	}
	function Slide_Out(i)
	{
		if(i==null)
		{
			INTERFACE.Clickable.Delete_Button(OverlayBtn);
			i = 0;
		}
		with(canvas)
		{
			clearRect(0,0,1000,1000);
			fillStyle = "blue";
			globalAlpha = 0.75;
			fillRect(disp_X,disp_Y+i,disp_W,disp_H);
			fillRect(disp_X+30,disp_Y-30+i,150,30);
			globalAlpha = 1;
			strokeStyle = "turquoise";
			strokeRect(disp_X,disp_Y+i,disp_W,disp_H);
			strokeRect(disp_X+30,disp_Y-30+i,150,30);
		}
		if(i<-Slide_Distance)
		{
			Display_Prompt_In = false;
			canvas.clearRect(0,0,1000,1000);
			if(!finished)
			{
				finished = true;
				canvas.restore();
				onFinishFnc();
			}
			return;
		}
		setTimeout(function(){Slide_Out(i-=Slide_Rate);},15);
	}
	function Queue_At_Start(addition)
	{
		for(var i=Queued_Texts.length;i>0;i--)
		{
			Queued_Texts[i] = Queued_Texts[i-1];
		}
		Queued_Texts[0] = addition;
	}
	function Queue(addition)
	{
		Queued_Texts[Queued_Texts.length] = addition;
	}
	function Get_First_Queue()
	{
		if(Queued_Texts.length==0)
			return "";
		var temp = Queued_Texts[0];
		Queued_Texts.splice(0,1);
		return temp;
	}
	function Queue_Speaker_At_Start(addition)
	{
		for(var i=Queued_Speakers.length;i>0;i--)
		{
			Queued_Speakers[i] = Queued_Speakers[i-1];
		}
		Queued_Speakers[0] = addition;
	}
	function Queue_Speaker(addition)
	{
		Queued_Speakers[Queued_Speakers.length] = addition;
	}
	function Get_First_Queued_Speaker()
	{
		if(Queued_Speakers.length==0)
			return "";
		var temp = Queued_Speakers[0];
		Queued_Speakers.splice(0,1);
		return temp;
	}

	let onFinishFnc = function(){},
		finished = false;

	this.Write = function(speaker,text,animate)
	{
		if(animate==null)
			animate = true;
		if(!Display_Prompt_In)
		{
			canvas.save();
			canvas.scale(INTERFACE.gameXScale, INTERFACE.gameYScale);
			if(animate)
				Slide_In(text, speaker, -Slide_Distance);
			else
				Slide_In(text,speaker,0);
		}
		else
		{
			Queue(text);
			Queue_Speaker(speaker);
		}
	};
	this.Next = function()
	{
		if(Cur_Drawing_Dialog)
		{
			abrupt_finish = true;
		}
		else
		{
			var text = Get_First_Queue();
			var speaker = Get_First_Queued_Speaker();
			if(text=="")
			{
				Slide_Out();
				return;
			}
			Draw(text,speaker);
		}
	};
	this.Currently_Drawing = function()
	{
		return Cur_Drawing_Dialog;
	};
	this.Displaying = function()
	{
		return Display_Prompt_In;
	};
	this.On_Finish = function(fnc)
	{
		onFinishFnc = fnc;
		finished = false;
	};
}
var Dialog;
