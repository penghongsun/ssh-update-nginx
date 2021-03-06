

const fs = require('fs')
const node_ssh = require('node-ssh');
const ssh = new node_ssh();
const open = require('open');
const colors = require('colors')
class sshNginx {
  constructor (options = {}) {
    this.options = Object.assign({ 
      username: 'root', 
      port: 22, 
      local: '', //本地nginx配置文件
      tryKeyboard: true,
      extendNgConf: '', //需要更新的nginx配置
      extendNgLinenum: 85, //插入到文件行数
      ergStr: '',
      isDockerNginx: false,
      serverPath: '',
      serverFile: 'default.conf',
      reloadNginxShell: 'nginx -s reload'
    }, 
      options
    )
  }
  // 将本地编译文件上传到nginx --> 下载nginx的conf文件到本地 --> 修改本地conf文件 -->  上传本地的conf文件到nginx --> 检查并重启nginx
  init() {
    const { host,  password, username, tryKeyboard, port, local, serverPath, serverFile, extendNgConf, extendNgLinenum, ergStr } = this.options
    ssh.connect({
      host,
      password,
      username,
      tryKeyboard,
      port
    }).then(() => {
      // Local, Remote
      ssh.getFile(local, `${serverPath}/${serverFile}`).then((Contents) => {
        open(local);
        console.log(colors.green('The File\'s contents were successfully downloaded'));
        this.writeFileToLine(local, extendNgConf, extendNgLinenum, ergStr)
      }, function(error) {
        console.log(colors.red('Something\'s wrong'));
        console.log(colors.red(error));
      });
    }).catch((err)=>{
      console.log(colors.red(err));
    });
  }

  //修改本地conf文件
  writeFileToLine(filePath, value, line, ergStr){
    const _fileCon = fs.readFileSync(filePath, 'utf8')
    if (ergStr && _fileCon.includes(ergStr)) {
      process.exit();
    }
  
    let data = _fileCon.split(/\r\n|\n|\r/gm); //readFileSync的第一个参数是文件名
    data.splice(line, 0, value);
    fs.writeFileSync(filePath, data.join('\r\n'))
    this.handleNginx()
  }

  //上传本地的conf文件到nginx
  handleNginx() {
    const { local, serverPath, serverFile, reloadNginxShell } = this.options
    ssh.putFile(local, `${serverPath}/${serverFile}`).then(function() {
      //在服务器上cwd配置的路径下测试配置文件是否有语法错误
      ssh.execCommand('nginx -t', { cwd: serverPath}).then(result => {
        if(result.stderr && !result.stderr.includes('successful')){
          console.error(colors.green(new Date().getTime(), result.stderr));
          return;
        }
        //重启服务器
          ssh.execCommand(reloadNginxShell, { cwd: serverPath}).then(() =>{
            console.log(colors.green('It\'s  were successfully'))
            process.exit();
          }).catch((error)=>{
            console.log(colors.red(error))
            process.exit();
          });
      }).catch(error => console.log(colors.red(error)));
    }, function(error) {
      console.log(colors.red(error))
      process.exit();
    })
  }
}

module.exports = sshNginx