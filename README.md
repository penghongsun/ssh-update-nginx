# node-ssh-update-nginx

```
const sshNginx = require('node-ssh-update-nginx')

new sshNginx({
  host: '197.0.0.1', // ip
  password: '***',
  extendNgConf: '', // 需要更新的nginx配置内容
  extendNgLinenum: 72, // 插入到配置文件行数
  local: path.resolve(__dirname, 'nginx.conf), // 本地nginx配置文件地址
  serverPath: '/*/*/conf.d' // nginx配置路径
}).init()
```