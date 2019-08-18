function Sound_list_class(LOCATION)
{
	var SND_LOC = "./sounds/"+LOCATION;
	var muted = false;
	function Sound_Class(src,name,loop,buff,volume,callback)
	{
		var snd;
		let auto = false;
		var _onplay = function(){};
		var _onend = function(){};
		let snd_ln;
		let self = this;
		if(src.Play)
		{
			snd = new Howl({
				urls:[src.Source()],
				buffer:buff,
				autoplay:auto,
				volume:volume,
				loop:loop,
				onplay:function(){
					_onplay();
				},
				onend:function(){
					_onend();
				},
				onload:function(){
					callback(self);
				}
			});
		}
		else
		{
			snd = new Howl({
				urls:[SND_LOC+src+'.wav', SND_LOC+src+'.ogg'],
				buffer:buff,
				autoplay:auto,
				volume:volume,
				loop:loop,
				onplay:function(){
					_onplay();
				},
				onend:function(){
					_onend();
				},
				onload:function(){
					callback(self);
				}
			});
		}

		this.Break_By = function(amt)
		{
			if(amt<=0)return this;
			snd_ln = snd._duration/amt - .015;
			let sprite = new Array(amt);
			for(let i=0;i<amt;i++)
				sprite[i] = [i*snd_ln*1000, snd_ln*1000];
			snd._sprite = sprite;
			return this;
		};
		this.Sprite_Amount = function()
		{
			return snd._duration/snd_ln;
		};

		this.Play = function(sprite, loop)
		{
			if(muted)return;
			snd.play(sprite, loop);
		};
		this.Stop = function()
		{
			snd.stop();
		};
		this.Pause = function()
		{
			snd.pause();
		};
		this.On_Play = function(fnc)
		{
			_onplay = fnc;
		};
		this.On_End = function(fnc)
		{
			_onend = fnc;
		};
		this.Loaded = function()
		{
			return snd._loaded;
		};
		this.Howl = function()
		{
			return snd;
		};
		this.Source = function()
		{
			return snd._src;
		};
		this.Name = function()
		{
			return name;
		};
	}

	var Sounds = [];
	var total_snds=0,loaded_snds=0;
	this.Declare = function(src,name,buff,loop,auto, callback)
	{
		for(var i in Sounds)
		{
			if(name==i)
			{
				console.error("Sound already declared with the name "+name);
				return;
			}
		}
		total_snds++;
		Sounds[name] = new Sound_Class(src,name,loop,buff,auto,function(self){
			loaded_snds++;
			if(callback!=null)
				callback(self);
		});
		return Sounds[name];
	};
	this.Delete = function(name)
	{
		return Core.Remove_Array_Index(Sounds,name);
	};
	this.Retrieve = function(name)
	{
		for(var i in Sounds)
		{
			if(name==i)
			{
				return Sounds[name];
			}
		}
		return null;
	};

	this.Stop_Loops = function()
	{
		for(var i in Sounds)
			Sounds[i].Stop();
	};
	this.Mute = function(input)
	{
		if(input==null)
			muted = !muted;
		else muted = input;
		return muted;
	};

	this.Done = function()
	{
		return (total_snds==loaded_snds);
	};
	this.Progress = function()
	{
		return loaded_snds/total_snds;
	};
	this.Empty = function()
	{
		total_snds = 0;
		loaded_snds = 0;
		Sounds = [];
	};
};

var SFXs = new Sound_list_class('sfx/');
var Music = new Sound_list_class('music/');
