zelas -- git user manager cli
===

[![NPM version][npm-image]][npm-url]

`zelas` can help you easy and fast manager git user.


## Install

```
$ npm install -g zelas
```

## Example
```
$ zelas add jinxin0112 m18508218948@163.com

    add user jinxin0112(m18508218948@163.com) success

```


## Usage

```
Usage: zelas [options] [command]

  Commands:

    ls                                    List all the git user
    current                               Show the user name or email
      -e  --show-email                      Show email
    use <user>                            Change user
    add <registry> <url>                  Add one user
    del <registry>                        Delete one user
    help                                  Print this help

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```





## LICENSE
MIT


[npm-image]: https://img.shields.io/npm/v/zelas.svg?style=flat-square
[npm-url]: https://npmjs.org/package/zelas
