using System;
using System.IO;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;
using System.Web.Script.Serialization;

static class ColorHost {
 [StructLayout(LayoutKind.Sequential)] public struct Effect { [MarshalAs(UnmanagedType.ByValArray,SizeConst=25)] public float[] Values; }
 [DllImport("Magnification.dll",SetLastError=true)] static extern bool MagInitialize();
 [DllImport("Magnification.dll",SetLastError=true)] static extern bool MagUninitialize();
 [DllImport("Magnification.dll",SetLastError=true)] static extern bool MagGetFullscreenColorEffect(out Effect effect);
 [DllImport("Magnification.dll",SetLastError=true)] static extern bool MagSetFullscreenColorEffect(ref Effect effect);
 static readonly object Gate=new object();static Effect baseline;static bool captured;static JavaScriptSerializer json=new JavaScriptSerializer();
 static void Check(bool ok,string name){if(!ok)throw new Exception(name+" failed (Windows "+Marshal.GetLastWin32Error()+").");}
 static Effect Identity(){var e=new Effect{Values=new float[25]};for(int i=0;i<5;i++)e.Values[i*5+i]=1;return e;}
 static bool Same(Effect a,Effect b){for(int i=0;i<25;i++)if(Math.Abs(a.Values[i]-b.Values[i])>.00002)return false;return true;}
 static void Apply(Effect effect){Check(MagSetFullscreenColorEffect(ref effect),"Apply color effect");Effect actual;Check(MagGetFullscreenColorEffect(out actual),"Read color effect");if(!Same(effect,actual))throw new Exception("Windows did not retain the color effect. Try closing other color tools.");}
 static void Restore(){lock(Gate){if(captured)Apply(baseline);}}
 static void Save(string file,Effect e){string temp=file+".tmp";using(var w=new BinaryWriter(File.Create(temp))){w.Write(Process.GetCurrentProcess().Id);foreach(var v in e.Values)w.Write(v);}if(File.Exists(file))File.Delete(file);File.Move(temp,file);}
 static Effect Load(string file,out int owner){var e=Identity();using(var r=new BinaryReader(File.OpenRead(file))){owner=r.ReadInt32();for(int i=0;i<25;i++)e.Values[i]=r.ReadSingle();}return e;}
 static bool Acquire(Mutex mutex,int timeout){try{return mutex.WaitOne(timeout);}catch(AbandonedMutexException){return true;}}
 static float Value(Dictionary<string,object> values,string key,float min,float max){object raw;if(!values.TryGetValue(key,out raw)||raw is bool||raw is string||raw==null)throw new Exception("Invalid "+key);float n=Convert.ToSingle(raw);if(float.IsNaN(n)||float.IsInfinity(n)||n<min||n>max)throw new Exception("Out of range: "+key);return n;}
 static Effect Build(Dictionary<string,object> v){
  if(v==null||v.Count!=5)throw new Exception("Expected five color controls.");
  float s=Value(v,"saturation",0,200)/100,c=Value(v,"contrast",80,140)/100,w=Value(v,"warmth",-300,300)/100,b=Value(v,"brightness",80,120)/100,t=Value(v,"tint",-100,100)/100;
  float[] gain={(1-Math.Max(0,-w)*.08f)*(1-Math.Max(0,-t)*.1f),1-Math.Abs(w)*.02f-Math.Max(0,t)*.12f,(1-Math.Max(0,w)*.08f)*(1-Math.Max(0,-t)*.1f)};
  float[] weights={.2126f,.7152f,.0722f};var e=Identity();
  for(int i=0;i<3;i++)for(int j=0;j<3;j++)e.Values[i*5+j]=((1-s)*weights[i]+(i==j?s:0))*c*gain[j]*b;
  for(int j=0;j<3;j++)e.Values[20+j]=.5f*(1-c)*gain[j]*b;return e;
 }
 static void Reply(object message){Console.WriteLine(json.Serialize(message));Console.Out.Flush();}
 static int Recovery(string[] args){try{
  int expected=int.Parse(args[1]);try{using(var parent=Process.GetProcessById(expected))parent.WaitForExit();}catch(ArgumentException){}
  using(var mutex=new Mutex(false,"Local\\ScreenColorNativeHost")){
   if(!Acquire(mutex,5000))return 0;
   try{if(!File.Exists(args[2]))return 0;int owner;var e=Load(args[2],out owner);if(owner!=expected)return 0;Check(MagInitialize(),"Recovery initialization");Apply(e);MagUninitialize();File.Delete(args[2]);return 0;}
   finally{mutex.ReleaseMutex();}
  }
 }catch{return 1;}}
 static int Probe(){
  try {Check(MagInitialize(),"Initialize");Check(MagGetFullscreenColorEffect(out baseline),"Capture baseline");captured=true;var e=Identity();e.Values[0]=.999f;Apply(e);Restore();Reply(new{ok=true,message="Native set/readback/restore verified"});return 0;}
  catch(Exception e){Reply(new{ok=false,error=e.Message});return 1;}finally{try{Restore();}catch{}MagUninitialize();}
 }
 static int Main(string[] args){
  if(args.Length>0&&args[0]=="--watch")return Recovery(args);
  if(args.Length>0&&args[0]=="--probe")return Probe();
  using(var mutex=new Mutex(false,"Local\\ScreenColorNativeHost")){
   if(!Acquire(mutex,0)){Reply(new{id=0,ok=false,error="Screen Color is already controlling this desktop."});return 1;}
   Timer monitor=null;string file=null;
   try{
    foreach(string name in new[]{"ColorTest","ColorTest-Live","ColorTest-Range"})foreach(var process in Process.GetProcessesByName(name)){
     try{if(process.SessionId==Process.GetCurrentProcess().SessionId)throw new InvalidOperationException("Close the old color experiment ("+name+") before enabling Screen Color.");}finally{process.Dispose();}
    }
    Check(MagInitialize(),"Initialize color engine");
    string folder=args.Length>1?args[1]:Path.GetTempPath();Directory.CreateDirectory(folder);file=Path.Combine(folder,"active-baseline.bin");
    // Recover any previous owner's journal while holding the shared desktop mutex.
    // A delayed old watcher must take the same mutex and verify ownership before restoring.
    if(File.Exists(file)){int previous;var original=Load(file,out previous);Apply(original);File.Delete(file);}
    Check(MagGetFullscreenColorEffect(out baseline),"Capture original colors");captured=true;Save(file,baseline);
    var recovery=new ProcessStartInfo(Process.GetCurrentProcess().MainModule.FileName,"--watch "+Process.GetCurrentProcess().Id+" \""+file+"\""){UseShellExecute=false,CreateNoWindow=true,WindowStyle=ProcessWindowStyle.Hidden};Process.Start(recovery);
    if(args.Length>0){int parent=int.Parse(args[0]);monitor=new Timer(delegate{try{using(var p=Process.GetProcessById(parent)){if(!p.HasExited)return;}}catch(ArgumentException){}try{Restore();}finally{Environment.Exit(0);}},null,1000,1000);}
    Reply(new{id=0,ok=true,ready=true});
    string line;while((line=Console.ReadLine())!=null){
     object id=null;try{
      if(line.Length>4096)throw new Exception("Command too large.");var command=json.Deserialize<Dictionary<string,object>>(line);id=command["id"];string name=command["command"] as string;
      lock(Gate){if(name=="apply")Apply(Build(command["values"] as Dictionary<string,object>));else if(name=="reset"||name=="quit")Restore();else if(name!="ping")throw new Exception("Unknown command.");}
      Reply(new{id=id,ok=true});if(name=="quit")break;
     }catch(Exception e){try{Restore();}catch{}Reply(new{id=id,ok=false,error=e.Message});}
    }return 0;
   }catch(Exception e){Reply(new{id=0,ok=false,error=e.Message});return 1;}
   finally{if(monitor!=null)monitor.Dispose();try{Restore();if(captured&&file!=null&&File.Exists(file))File.Delete(file);}catch{}MagUninitialize();mutex.ReleaseMutex();}
  }
 }
}
