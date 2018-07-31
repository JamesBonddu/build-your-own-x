# create my own database

探索步骤:
- 先从wiki开始了解DataBase是个什么玩意;了解和它相关的设计
- 选取一个较为简单的开源数据库的实现,从改动它的一点代码开始,了解它的使用设计理念.
- 阅读一些数据库相关的书籍.

## Database wiki

数据库是一个有组织的存储和获取数据的集合。
数据库管理工具是一个和终端用户,其他应用和数据库本身用来捕捉和分析数据的.DBMS通常需要有CURD,以及管理员数据库.不同的DBMS能够通过例如:SQL,ODBC,JDBC等标准进行数据共享.

1980s关系型数据库成为主流.
2000s非关系新数据库开始流行NoSQL,由于它们使用不同的查询语言。

Database 和DatabaseManagement system 的区别.

DBMS需要提供能够管理数据，能将它的数据分为以下几个方法集:
- Data definition - 创建Creation,修改modification,和删除removal定义组织数据.
- Update - 插入,修改,和删除实际数据.
- Retrieval - 提供一个表格直接使用或者被其他程序处理的信息.复原的数据能够和之前未修改过的数据一样。
- Administration -注册和监控users,增强数据安全,监控性能,维持数据后完整性。

DBMS和database都是数据库原则的一部分.

数据库的开发技术历程可以大致分为3个方面基于数据模型或结构,navigation,SQL/relation,andpost-relational.

2个早期主要的导航模型都是高层模型主要应用于IBM的IMS系统,和CODASYL网络模型应用于IDMS的一系列产品.

relation model关系模型,最早是Edgar.F.Codd在1970年提出的,一反常规,并坚持应用搜索数据应该基于content而不是links.关系模型依赖于一系列台账风格的table,每一个都有不同的用途.知道1980s中期,计算机硬件才有足够的能力支持关系型系统的广泛使用.在1990s初期,关系型数据库在大规模数据处理程序中占主导地位.
在2018它们仍然占着主导地位:IBM DB2,Oracle,MySQL和Microsoft Server都是顶级的DBMS.

Object databases都是从1980s才出现的,目的是解决对象关系阻抗不匹配,这导致了“后关系”一词的创造以及混合对象关系数据库的发展。

下一代post-relational数据库在2000s变的广为人知比如NoSQL数据库,引入快速键值存储和面向文档的数据库."next generation"竞争以NewSQL数据库尝试新的实现，保留关系型数据库模型那个用来匹配NoSQL和商业可用的

Codd的paper被Berkeley的两个人选中,Eugene Wong和Michael Stonebraker.他们开始了一个INGERS项目,从1973开始，INGERS发布了它的第一款测试产品，使用了data access,QUEL语言》

Late 1970s,SQL DBMS
IBM在1970s早期开始工作于一个基于Codd's理念的System R的原型系统.之后纳入SQL查询,推出真正的System R,命名为 SQL/DS后来叫DB2.

## 语言
数据库专用语言:
- 数据控制语言(DCL) 控制对数据的访问
- 数据定义语言(DDL) 定义数据类型,如创建或删除以及它们之间的关系.
- 数据操作语言(DML) 执行插入,更新或删除数据事件等任务
- 数据查询语言(DQL) 允许搜索信息和计算派生信息,

## 模型

- 导航数据库
    - 分层数据库模型
    - 网络模型
    - 图数据库

- 关系模型
- 实体关系模型
    - 增强的实体关系模型
- 对象模型
- 文件模型
- 实体-属性-值模型
- 星型架构

## 数据库是怎么运行的?

- 数据以什么格式进行存储的?在内存上还是在硬盘上
- 它什么时候该从内存移到硬盘上?
- 为什么每个表只能有一个主键?
- 怎么回滚一个交易工作?
- 索引是怎么格式化的?
- 全表扫描是什么情况下发生的?
- 什么格式应该预备声明保存?

### Tables of Contents
- 介绍和建立REPL

#### SQLITE的架构设计
`Interface`
---
避免命名冲突,所有符号都以sqlite3开头,for example sqlite3rbu_,sqlite3session_
   
`Tokenizer`
---
当一个包含SQL声明的字符串第一次被发送到tokenizer,那么tokenizer将SQL text划分为tokens和将这一堆tokens一个一个送去parser.注意这个设计,`tokenizer`叫作`parser`,熟悉YACC和BISON的人可能会比较熟悉这些东西.)
   
`Parser`
---
它基于他们的context分配token,SQLite的parser生成器用的是Lemon parser generator.
    
`Code Generator`
---
当解析器将标记组装成一个解析树,代码生成器开始分析解析数并生成`bytecode`为SQL声明使用.之前准备好的声明对象这个字节码的容器.
The Code generator特别是**Where*.c**和**select.c**通常被称为查询计划
    
`Bytecode Engine`
---
字节码程序由codegenerator创造在虚拟机中运行。
虚拟机本身全部包含在*vdbe.c* the *vdbe.h*;
SQLite使用c语言routines扩展SQL函数,比如很多的内置SQL函数(ex: abs(), count(),..)

`B-Tree`
---
一个SQLite数据库只要是用B-tree在硬盘上做查找.一个分离的B-tree用来表示数据库中每个表和索引,所有的B-trees都存在一个硬盘文件上,文件格式细节稳定且定义明确，并保证向前兼容。

`Page Cache`
---
B-tree模块从硬盘请求信息在指定大小的pages.默认的page_szie是4096,但是能是512和65536之间的字节。这个page cache用来响应读,写和caching pages。page cache也提供回滚和自动提交抽象,并且关注数据库文件锁,B-tree driver从page cache请求特殊的pages,并通知the page cache 当前是什么操作.

`OS Interface`
---
为了兼容不同的操作系统,SQLite使用抽象的数据类型叫做VFS,每一个VFS提供
- Opening
- read
- writing
- closing fies on disk
- for other OS-specific task比如 finding the current time

`Utilities`
---
内存回收,无壳字符串比较例程,便携式文本到数字转换例程.
解析器使用的符号表由hash.c中的哈希表维护。
utf.c源文件包含Unicode转换子例程。

一个query经过一系列组件为了取到或者修改数据.可以分为

**front-end**
- tokenizer
- parser
- code generator

输入是一个SQL query,输出一个sqlite virtual machine bytecode.

**back-end**
- virtual machine
- B-tree
- pager
- os interface

虚拟机拿着front-end生成的bytecode作为指令.它表示对一个或多个表或是idnex的操作,被存在一个B-tree数据结构中。VM是对于转换SQL statement 到bytecode 指令是非常重要的.

每一个B-tree包含很多nodes,每个node是one page in length.B-tree能够从硬盘取回或是放入硬盘使通过给pager发布指令达到目的的。

这个pager接受指令用于读写多页数据.它正确地响应在数据库文件里的合适位置的读写.它也持有了一个最近accessed的page缓存在内存里面,并决定哪些需要写回硬盘.

os interface是不同操作系统对于sqlite的依赖.



> Refrence

[quroa design a database 设计数据库的工具](https://www.quora.com/How-do-you-design-a-database)

[怎么获取create my own database system的方法](https://softwareengineering.stackexchange.com/questions/121653/create-my-own-database-system)

[](https://softwareengineering.stackexchange.com/questions/121653/create-my-own-database-system#121683)

[Database wiki](https://en.wikipedia.org/wiki/Database)

[build your own x](https://github.com/danistefanovic/build-your-own-x)