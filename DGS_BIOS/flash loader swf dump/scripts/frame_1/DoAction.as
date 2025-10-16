stop();
System.security.allowDomain("neopets.com");
var user_version = $version;
var user_version_num = user_version.slice(4,5);
var user_url = _url;
var swf_location = user_url.slice(0,4);
_level0.game_tracking = 0;
_level0.game_multiple = 0;
mainClass = function()
{
   var _loc1_ = this;
   _loc1_.load_state = 0;
   _loc1_.game = "";
   _loc1_.game_type = "swf";
   _loc1_.game_quality = "HIGH";
   _loc1_.game_framerate = 18;
   _loc1_.average_real_framerate = 18;
   _loc1_.game_version = 1;
   _loc1_.game_id = 212;
   _loc1_.game_width = 0;
   _loc1_.game_height = 0;
   _loc1_.game_neopointratio = 1;
   _loc1_.game_capOnNeopoints = 1000;
   _loc1_.username = "Flash_Loader_USERNAME";
   _loc1_.nsm = 0;
   _loc1_.nsid = -1;
   _loc1_.sh = "";
   _loc1_.sk = "";
   _loc1_.lang = "en";
   _loc1_.game_hiscore = 0;
   _loc1_.game_scoreposts = 0;
   _loc1_.game_verifiedact = 1;
   _loc1_.FG_GAME_BASE = "";
   _loc1_.FG_SCRIPT_BASE = "";
   _loc1_.FG_PHTML_BASE = "";
   _loc1_.include_url = "";
   _loc1_.game_url = "";
   _loc1_.include_level = 100;
   _loc1_.game_level = 10;
   _loc1_.movie_include = NULL;
   _loc1_.movie_game = NULL;
   _loc1_.bScoreIsSent = false;
   _loc1_.time;
   _loc1_.setBaseUrls = function(baseurl)
   {
      var _loc1_ = this;
      var _loc2_ = baseurl;
      _loc1_.FG_SCRIPT_BASE = "http://" + _loc2_ + "/";
      _loc1_.FG_PHTML_BASE = "http://" + _loc2_ + "games/dgs/";
      if(_loc2_.indexOf("dev") == -1)
      {
         _loc1_.FG_GAME_BASE += "http://swf.neopets.com/";
      }
      else
      {
         _loc1_.FG_GAME_BASE += "http://images50.neopets.com/";
      }
      _loc1_.include_url = _loc1_.FG_GAME_BASE + "games/gaming_system/dgs_include_v2.swf";
      _loc1_.game_url = _loc1_.FG_GAME_BASE + "games/";
   };
   _loc1_.setGameVars = function(user, q, id, v, n, c, t, sh, sk, w, h, f, nsm, nsid, g, lg, ncr, hs, gp, va, tracking, multiple, pa)
   {
      var _loc1_ = this;
      _loc1_.game = g + ".swf";
      _loc1_.username = user;
      _loc1_.game_quality = q;
      _loc1_.game_id = id;
      _loc1_.game_version = v;
      _loc1_.game_neopointratio = n;
      _loc1_.game_capOnNeopoints = c;
      _loc1_.game_type = t;
      _loc1_.nsm = nsm;
      _loc1_.nsid = nsid;
      _loc1_.sh = sh;
      _loc1_.sk = sk;
      _loc1_.game_width = w;
      _loc1_.game_height = h;
      _loc1_.game_framerate = f;
      _loc1_.average_real_framerate = f;
      _loc1_.lang = lg;
      _loc1_.game_hiscore = hs;
      _loc1_.game_scoreposts = gp;
      _loc1_.game_verifiedact = va;
      _level0.game_username = user;
      _level0.game_hiscore = hs;
      _level0.game_scoreposts = gp;
      _level0.game_verifiedact = va;
      _level0.game_tracking = tracking;
      _level0.game_multiple = multiple;
      _level0.game_playsAllowed = pa;
   };
   _loc1_.sendProtocol = function(subject, body, email_id)
   {
      var _loc1_ = this.FG_PHTML_BASE + "dgs_protocol.phtml?";
      _loc1_ += "id=" + email_id + "&subject=" + subject + "&body=" + body;
      loadVariables(_loc1_,_level13,"POST");
   };
   _loc1_.setESCORE = function(escore)
   {
      _level100.include.ESCORE = escore;
      _level100.include.sendTheScoreNow();
   };
   _loc1_.loadIncludeMovie = function()
   {
      var _loc1_ = this;
      _loc1_.include_url = _loc1_.FG_GAME_BASE + "games/gaming_system/dgs_include_v2.swf";
      loadMovieNum(_loc1_.include_url,_loc1_.include_level);
      _loc1_.load_state = 1;
   };
   _loc1_.includeIsLoaded = function()
   {
      var _loc1_ = this;
      var _loc2_ = false;
      _loc1_.movie_include = _root["_level" + _loc1_.include_level];
      var _loc3_ = int(_loc1_.movie_include.getBytesLoaded() / _loc1_.movie_include.getBytesTotal() * 100);
      if(_loc3_ == 100)
      {
         _loc1_.movie_include.include.game_level = _loc1_.game_level;
         _loc1_.movie_include.include.loaded_by_flash_loader = true;
         _loc1_.load_state = 2;
         _loc2_ = true;
      }
      return _loc2_;
   };
   _loc1_.loadPreloaderTranslation = function()
   {
      var _loc1_ = _root["_level" + this.include_level];
      _loc1_.include.preloaderTranslation();
   };
   _loc1_.preloaderTranslationLoaded = function()
   {
      var _loc1_ = false;
      var _loc2_ = _root["_level" + this.include_level].include;
      if(_loc2_.preloaderTranslationSuccess == true)
      {
         _loc1_ = true;
      }
      return _loc1_;
   };
   _loc1_.loadGame = function()
   {
      var _loc1_ = this;
      _loc1_.game_url += _loc1_.game;
      loadMovieNum(_loc1_.game_url,_loc1_.game_level);
      _loc1_.load_state = 3;
   };
   _loc1_.gameIsLoaded = function()
   {
      var _loc1_ = this;
      var _loc2_ = false;
      _loc1_.movie_game = _root["_level" + _loc1_.game_level];
      var _loc3_ = int(_loc1_.movie_game.getBytesLoaded() / _loc1_.movie_game.getBytesTotal() * 100);
      if(_loc3_ == 100)
      {
         _loc1_.movie_game._quality = _loc1_.game_quality;
         var bios = _loc1_.movie_game.BiosLoader.bios;
         _loc1_.load_state = 3;
         _loc2_ = true;
      }
      return _loc2_;
   };
   _loc1_.showGameLoadStats = function()
   {
      var _loc1_ = this;
      cStat = "";
      bytesloaded = _loc1_.movie_game.getBytesLoaded();
      bytestotal = _loc1_.movie_game.getBytesTotal();
      percentloaded = int(_loc1_.movie_game.getBytesLoaded() / _loc1_.movie_game.getBytesTotal() * 100);
      percenttotal = 100;
      if(_loc1_.time == undefined)
      {
         _loc1_.time = new Object();
         _loc1_.time.init = getTimer();
      }
      _loc1_.time.elapsed = int((getTimer() - _loc1_.time.init) / 1000);
      kps = int(bytesloaded / _loc1_.time.elapsed / 100) / 10;
      _loc1_.time.estimatedtotal = int(bytestotal / kps / 1000);
      cStat = "<p align = \'center\'><font size = \'40\' ><u>Flash Version: " + user_version_num + "</u>\n" + percentloaded + " % Loaded" + "\n" + int(bytesloaded / 1000) + "k / " + int(bytestotal / 1000) + " k\nElapsed Time: " + _loc1_.time.elapsed + " sec.\nEstimated Time: " + _loc1_.time.estimatedtotal + " sec.\nRate: " + kps + " kps</font></p>";
      return cStat;
   };
   _loc1_.getGameLoadStats = function()
   {
      var _loc1_ = this;
      cStat = "";
      bytesloaded = _loc1_.movie_game.getBytesLoaded();
      bytestotal = _loc1_.movie_game.getBytesTotal();
      percentloaded = int(_loc1_.movie_game.getBytesLoaded() / _loc1_.movie_game.getBytesTotal() * 100);
      percenttotal = 100;
      if(_loc1_.time == undefined)
      {
         _loc1_.time = new Object();
         _loc1_.time.init = getTimer();
      }
      _loc1_.time.elapsed = int((getTimer() - _loc1_.time.init) / 1000);
      kps = int(bytesloaded / _loc1_.time.elapsed / 100) / 10;
      _loc1_.time.estimatedtotal = int(bytestotal / kps / 1000);
      cStat = "[" + user_version_num + "," + percentloaded + "," + int(bytesloaded / 1000) + "," + int(bytestotal / 1000) + "," + _loc1_.time.elapsed + "," + _loc1_.time.estimatedtotal + "," + int(kps) + "]";
      return cStat;
   };
   _loc1_.resetScoreSentFlag = function()
   {
      this.bScoreIsSent = false;
   };
   _loc1_.getScoreSentFlag = function()
   {
      return this.bScoreIsSent;
   };
   _loc1_.scoreIsSent = function()
   {
      this.bScoreIsSent = true;
   };
};
myDMXClass = function()
{
   var _loc1_ = this;
   _loc1_.gS = {};
   _loc1_.gN = {};
   _loc1_.gD = {};
   _loc1_.gU = {};
   _loc1_.evars = [];
   _loc1_.passw = [];
   _loc1_.aV = [];
   _loc1_.createScoringObjects = function()
   {
      this.gS = new _level100.include.ScoringSystem(0);
      this.gN = new _level100.include.NeoStatus(0);
   };
   _loc1_.createEvar = function(val, str1, str2)
   {
      var _loc1_ = this;
      evarObj = new _loc1_.gS.Evar(val,str1,str2);
      _loc1_.evars.push(evarObj);
      return int(_loc1_.evars.length - 1);
   };
   _loc1_.changeEvarTo = function(evarIndex, val)
   {
      this.evars[evarIndex].changeTo(val);
   };
   _loc1_.changeEvarBy = function(evarIndex, val)
   {
      this.evars[evarIndex].changeBy(val);
   };
   _loc1_.showEvar = function(evarIndex)
   {
      return this.evars[evarIndex].show();
   };
   _loc1_.createPassword = function(str)
   {
      var _loc1_ = this;
      passObj = new _loc1_.gS.Password(str);
      _loc1_.passw.push(passObj);
      return int(_loc1_.passw.length - 1);
   };
   _loc1_.passGetEncrypted = function(passIndex)
   {
      return this.passw[passIndex].getEncrypted();
   };
   _loc1_.passGetDecrypted = function(passIndex)
   {
      return this.passw[passIndex].getDecrypted();
   };
   _loc1_.loadDictionary = function()
   {
      this.gD = new _level100.include.Dictionary(0);
      return this.gD.getHelp();
   };
   _loc1_.DictionaryLoaded = function()
   {
      return int(this.gD.getPercentLoaded());
   };
   _loc1_.createUserInfo = function()
   {
      this.gU = new _level100.include.userProfile([1,2,3,4,5,6,7,8,9,10,11,12,13,14]);
      return this.gU.getHelp();
   };
   _loc1_.resetGS = function()
   {
      var _loc1_ = this;
      _loc1_.gS.reset();
      _loc1_.evars = [];
      _loc1_.passw = [];
      return "msg from scoring system: include.ScoringSystem has been reset";
   };
   _loc1_.initScoreMeter = function(x, y, w, h)
   {
      _level100._x = x;
      _level100._y = y;
      _level100._width = w;
      _level100._height = h;
      return "msg from scoring system: scoreMeter has been initialized";
   };
   _loc1_.setIncludeVar = function(cVar, val)
   {
      var _loc1_ = cVar;
      _level100.include[_loc1_] = val;
      return "msg from scoring system: var " + _loc1_ + " has been set to " + _level100.include[_loc1_];
   };
   _loc1_.sendTagToNS = function(cTag)
   {
      this.gN.sendTag(cTag);
      return "msg from scoring system: tag " + cTag + " has been sent";
   };
   _loc1_.setGameScore = function(iScore, eScore)
   {
      this.gS.setScore(iScore,eScore);
      return "msg from scoring system: score of " + String(iScore) + " has been set";
   };
   _loc1_.submitGameScore = function()
   {
      this.gS.submitScore();
      return "msg from scoring system: score has been submitted";
   };
   _loc1_.setBaseVars = function(cStr)
   {
      var _loc2_ = this;
      var aPairs = cStr.split("&");
      var _loc1_ = 0;
      var _loc3_;
      while(_loc1_ < aPairs.length)
      {
         _loc3_ = aPairs[_loc1_].split("=");
         _loc2_.aV.push(_loc3_);
         _loc1_ = _loc1_ + 1;
      }
      _loc1_ = 0;
      while(_loc1_ < _loc2_.aV.length)
      {
         if(_loc2_.aV[_loc1_][0] == "id")
         {
            _level0.game_id = _loc2_.aV[_loc1_][1];
         }
         else if(_loc2_.aV[_loc1_][0] == "n")
         {
            _level0.game_neopointratio = _loc2_.aV[_loc1_][1];
         }
         else if(_loc2_.aV[_loc1_][0] == "c")
         {
            _level0.game_capOnNeopoints = _loc2_.aV[_loc1_][1];
         }
         else if(_loc2_.aV[_loc1_][0] == "v")
         {
            _level0.game_version = _loc2_.aV[_loc1_][1];
         }
         _loc1_ = _loc1_ + 1;
      }
   };
   _loc1_.showBaseVars = function()
   {
      cStr = "vars:\n" + _level0.game_id + "\n" + _level0.game_neopointratio + "\n" + _level0.game_capOnNeopoints + "\n" + _level0.game_version;
      return cStr;
   };
};
