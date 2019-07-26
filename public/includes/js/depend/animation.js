function Animation_Display_Class()
{
	let places_class = function(holder,C,X,Y,W,H,S,i)
	{
		this.set = function(update)
		{
			var ani = this.values;
			if(ani.show)
			{
				holder.Clear(ani.canvas, ani.x, ani.y, ani.width, ani.height);
			}
			for(var i in update)
			{
				ani[i] = update[i];
			}
			if(ani.show)
			{
				holder.Draw(ani.canvas, ani.x, ani.y, ani.width, ani.height);
			}
		};
		this.values = {
			canvas:C,
			x:X,
			y:Y,
			width:W,
			height:H,
			show:S,
			index:i
		};
	};

	function Animation_Class(images,name,delay,auto_repeat)
	{ // delay is how many frames each image displays
		var imgs = images;
		var _name = name;
		var _delay = delay;
		var _auto = auto_repeat;
		var loaded_images=0;
		var loop_index=0,delay_index=0;
		var places = [];
		let callback;

		this.onEnd = function(_cb)
		{
			callback = _cb;
		};

		this.Length = imgs.length;
		this.Stop = true;
		this.Loaded = function()
		{
			for(var i=0;i<imgs.length;i++)
			{
				if(!imgs[i].Loaded())
					return false;
			}
			return true;
		};

		this.Draw = function(canvas,x,y,w,h)
		{
			imgs[loop_index].Draw(canvas,x,y,w,h);
		};
		this.Clear = function(canvas,x,y,w,h)
		{
			canvas.clearRect(x,y,w,h);
		};

		this.Increment = function()
		{
			delay_index++;
			var changed = false;
			if(delay_index>=_delay)
			{
				loop_index++;
				changed = true;
				delay_index = 0;
			}
			if(loop_index>=this.Length)
			{
				if(!_auto)
				{
					this.Stop = true;
				}
				loop_index = 0;
				changed = true;
			}
			if(changed)
			{
				for(var i in places)
				{
					if(places[i].values.show)
					{
						this.Clear(places[i].values.canvas, places[i].values.x, places[i].values.y, places[i].values.width, places[i].values.height);
						if(!this.Stop)this.Draw(places[i].values.canvas, places[i].values.x, places[i].values.y, places[i].values.width, places[i].values.height);
					}
				}
			}
			if(this.Stop)
			if(callback)
				callback();
		};

		this.New = function(C,X,Y,W,H,S)
		{
			var i = places.length;
			places[i] = new places_class(this,C,X,Y,W,H,S,i);
			if(S)this.Draw(C,X,Y,W,H);
			return places[i];
		};
		this.Remove = function(index)
		{
			if(places[index])
			{
				places.splice(index,1);
				for(var i=index;i<places.length;i++)
				{
					places[i].values.index--;
				}
			}
			return this;
		};
		this.Remove_All = function()
		{
			places = [];
		};

		this.Images = function()
		{
			return imgs;
		};
		this.Image_At = function(index)
		{
			if(index<imgs.length)
				return imgs[index];
			return null;
		}
		this.Name = function()
		{
			return _name;
		};
		this.Delay = function()
		{
			return _delay;
		};
		this.Autoplay = function(value)
		{
			if(value==null)
			{
				value = true;
			}
			_auto = value;
		};
	};
	function Sprite_Sheet_Handler(sheet, name, delay, auto_repeat)
	{
		var _name = name;
		var _delay = delay;
		var _auto = auto_repeat;
		var loop_index=0,delay_index=0;
		var places = [];
		let frame_w, frame_h;
		let _length, _height;
		let callback;

		this.onEnd = function(_cb)
		{
			callback = _cb;
		};

		this.Stop = true;

		this.Draw = function(canvas,x,y,w,h)
		{
			sheet.Crop(canvas,x,y,(loop_index%_length)*frame_w,Math.floor(loop_index/_length)*frame_h,frame_w,frame_h,w,h);
		};
		this.Clear = function(canvas,x,y,w,h)
		{
			canvas.clearRect(x,y,w,h);
		};

		this.Increment = function()
		{
			delay_index++;
			var changed = false;
			if(delay_index>=_delay)
			{
				loop_index++;
				changed = true;
				delay_index = 0;
			}
			if(loop_index>=this.Length)
			{
				if(!_auto)
				{
					this.Stop = true;
				}
				loop_index = 0;
			}
			if(changed)
			{
				for(var i in places)
				{
					if(places[i].values.show)
					{
						this.Clear(places[i].values.canvas, places[i].values.x, places[i].values.y, places[i].values.width, places[i].values.height);
						if(!this.Stop)this.Draw(places[i].values.canvas, places[i].values.x, places[i].values.y, places[i].values.width, places[i].values.height);
					}
				}
			}
			if(this.Stop)
			if(callback)
				callback();
		};

		this.New = function(C,X,Y,W,H,S)
		{
			var i = places.length;
			places[i] = new places_class(this,C,X,Y,W,H,S,i);
			if(S)this.Draw(C,X,Y,W,H);
			return places[i];
		};
		this.Remove = function(index)
		{
			if(places[index])
			{
				places.splice(index,1);
				for(var i=index;i<places.length;i++)
				{
					places[i].values.index--;
				}
			}
		};
		this.Remove_All = function()
		{
			places = [];
		};

		this.Name = function()
		{
			return _name;
		};
		this.Delay = function()
		{
			return _delay;
		};
		this.Autoplay = function(value)
		{
			if(value==null)
			{
				value = true;
			}
			_auto = value;
		};

		this.Frame_Size = function(_w, _h)
		{
			_length = _w;
			_height = _h;
			frame_w = Math.floor(sheet.Image().width/_w);
			frame_h = Math.floor(sheet.Image().height/_h);
			this.Length = _length*_height;
			return this;
		};
		this.Frame_Size(10, 10);

		this.Loaded = function()
		{
			return sheet.Loaded();
		};
	}

	var Animations = [];
	var total_animations=0,loaded_animations=0;
	this.kill = false;
	this.Increment = function()
	{
		if(this.kill)return;
		for(var i in Animations)
		{
			if(Animations[i].Stop)
				continue;
			Animations[i].Increment();
		}
	};
	this.Remove_All = function()
	{
		for(var i in Animations)
		{
			Animations[i].Remove_All();
		}
	};

	this.Declare = function(images,name,delay,auto_repeat)
	{
		for(var i in Animations)
		{
			if(name==i)
			{
				console.error("Animation already declared with that name.");
				return;
			}
		}
		if(delay==null)
		{
			delay = 10;
		}
		if(auto_repeat==null)
		{
			auto_repeat = true;
		}
		var temp_copy = [];
		for(var i in images)
		{
			temp_copy[i] = images[i];
		}
		let Choice_Class = Animation_Class;
		if(images.Crop)Choice_Class = Sprite_Sheet_Handler;
		Animations[name] = new Choice_Class(temp_copy,name,delay,auto_repeat);
		return Animations[name];
	};
	this.Delete = function(name)
	{
		return Core.Remove_Array_Index(Animations,index);
	};
	this.Retrieve = function(name)
	{
		for(var i in Animations)
		{
			if(name==i)
			{
				return Animations[name];
			}
		}
		return null;
	};
	this.Empty = function()
	{
		total_animations = 0;
		loaded_animations = 0;
		Animations = [];
	};
}
var Animations = new Animation_Display_Class();
