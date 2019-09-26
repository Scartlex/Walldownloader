const St = imports.gi.St;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

let text, button;
const session = new Soup.SessionSync();
const sessionAsync = new Soup.SessionAsync();

// Get application folder and add it into the imports path
function getAppFileInfo() {
    let stack = (new Error()).stack,
        stackLine = stack.split('\n')[1],
        coincidence, path, file;

    if (!stackLine) throw new Error('Could not find current file (1)');

    coincidence = new RegExp('@(.+):\\d+').exec(stackLine);
    if (!coincidence) throw new Error('Could not find current file (2)');

    path = coincidence[1];
    file = Gio.File.new_for_path(path);
    return [file.get_path(), file.get_parent().get_path(), file.get_basename()];
}
const path = getAppFileInfo()[1];
imports.searchPath.push(path);

const Timer = imports.assets.timers;

function GET(url) {
    let request = Soup.Message.new('GET', url);
    session.send_message(request);
    return request.response_body.data;
}

class Provider {
    constructor() {
    }

    GET() {
        let request = Soup.Message.new('GET', url);
        session.send_message(request);
        return request.response_body.data;
    }

}

class NasaAPOD {
    download() {
        return JSON.parse(GET('https://api.nasa.gov/planetary/apod?api_key=G5iCAZRDIuK8yLfi2p7C643gWAPHhf657MzW0G0x')).hdurl;
    }
}

class Wallhaven extends Provider {
    constructor(props) {
        super(props)
        this.apikey = 'cOxYxXJvBihaSADxwys3CBmqI7gk6Fh8';
        this.ratios = '16x9';
        this.atLeast = '1920x1080';
        this.sorting = 'random';
        this.categories = '111';
        this.purity = '100';
    }

    download() {
        return JSON.parse(this.GET(`https://wallhaven.cc/api/v1/search?apikey=${this.apikey}&ratios=${this.ratios}&atLeast=${this.atLeast}&sorting=${this.sorting}&categories=${this.categories}&purity=${this.purity}`)).data[0].path;
    }
}

const wallhaven = new Wallhaven();
const backgroundSettings = new Gio.Settings({schema: 'org.gnome.desktop.background'});

function changeWallpaper() {
    const imgUrl = wallhaven.download();
    backgroundSettings.set_string('picture-uri', imgUrl);
    Gio.Settings.sync();
}

function debugAndChange() {
    _showHello('Hello');
    changeWallpaper();
}

function _hideHello() {
    Main.uiGroup.remove_actor(text);
    text = null;
}

function _showHello(msg) {

    const wallhaven = new Wallhaven();
    const imgUrl = wallhaven.download();

    if (!text) {
        text = new St.Label({ style_class: 'helloworld-label', text: msg });
        Main.uiGroup.add_actor(text);
    }

    text.opacity = 255;

    let monitor = Main.layoutManager.primaryMonitor;

    text.set_position(Math.floor(monitor.width / 2 - text.width / 2),
        Math.floor(monitor.height / 2 - text.height / 2));

    Tweener.addTween(text,
        { opacity: 0,
            time: 2,
            transition: 'easeOutQuad',
            onComplete: _hideHello });
}

function init() {
    button = new St.Bin({ style_class: 'panel-button',
                          reactive: true,
                          can_focus: true,
                          x_fill: true,
                          y_fill: false,
                          track_hover: true });
    let icon = new St.Icon({ icon_name: 'system-run-symbolic',
                             style_class: 'system-status-icon' });

    button.set_child(icon);
    button.connect('button-press-event', debugAndChange);
}

let wallpaperInterval;

function enable() {
    Main.panel._rightBox.insert_child_at_index(button, 0);
    wallpaperInterval = Timer.setInterval(changeWallpaper, 10000);
    changeWallpaper();

}

function disable() {
    Main.panel._rightBox.remove_child(button);
    Timer.clearInterval(wallpaperInterval);
}
