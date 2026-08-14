# dsh-cache-stabilizer

[![CI](https://github.com/dongsheng123132/dsh-cache-stabilizer/actions/workflows/ci.yml/badge.svg)](https://github.com/dongsheng123132/dsh-cache-stabilizer/actions/workflows/ci.yml)
[![MIT 许可证](https://img.shields.io/github/license/dongsheng123132/dsh-cache-stabilizer)](LICENSE)
[![Node.js 22+](https://img.shields.io/badge/Node.js-%E2%89%A522-339933?logo=nodedotjs&logoColor=white)](package.json)
[![Awesome DSH Plugins](https://img.shields.io/badge/Awesome_DSH-%E5%B7%B2%E9%AA%8C%E8%AF%81%E5%AE%9E%E9%AA%8C-0969da)](https://github.com/dongsheng123132/awesome-dsh-plugins/blob/main/README.zh-CN.md#2origin-%E6%8F%92%E4%BB%B6%E5%AE%9E%E9%AA%8C%E5%AE%A4)

一个 MIT 开源的 DeepSeek Harness 缓存前缀稳定插件。它不伪造缓存，也不会为了命中率使用过期上下文。

它做两项不改变语义的处理：

- 把 DSH 已知默认 persona 中的工作目录从系统提示词前缀移到运行时上下文。不同项目因此能复用相同的系统前缀，同时每次请求仍会收到正确的 `cwd`。
- 递归固定工具 schema 的对象键顺序。DSH 自己已经固定了工具名称顺序。

插件还注册了仅供人使用的 `/cache` 命令，显示模型供应商实际返回的命中 token、未命中 token、写缓存 token 和命中率。

## 安装

```sh
dsh plugin --profile web add dsh-cache-stabilizer
```

重启 DSH，完成几轮对话后输入 `/cache`。

## 安全边界

插件只改写 DSH 标准 coding persona 的那一句固定模板。自定义 persona 里其他形式的 `{{cwd}}` 不会被猜测式搬运。插件不会冻结工具清单、复用陈旧状态、代理模型响应，也不会另外造一层结果缓存。

## 开发

```sh
npm test
npm run check
```
