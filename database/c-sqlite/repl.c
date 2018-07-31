#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct InputBuffer_t {
    char* buffer;
    size_t buffer_length;
    ssize_t input_length;
};

typedef struct InputBuffer_t InputBuffer;

InputBuffer* new_input_buffer() {
    InputBuffer* input_buffer = malloc(sizeof(InputBuffer));
    input_buffer->buffer = NULL;
    input_buffer->buffer_length = 0;
    input_buffer->input_length = 0;

    return input_buffer;
}

void print_prompt() { printf("db > "); }

void read_input(InputBuffer* input_buffer) {
    ssize_t bytes_read = getline(&(input_buffer->buffer), &(input_buffer->buffer_length), stdin);

    if (bytes_read <= 0) {
        printf("Error reading input\n");
        exit(EXIT_FAILURE);
    }

    // Ignore trailing newline
    input_buffer->input_length = bytes_read - 1;
    input_buffer->buffer[bytes_read - 1] = 0;
}


int main(int argc, char* argv[]) {
    InputBuffer* input_buffer = new_input_buffer();
    while (true) {
        print_prompt();
        read_input(input_buffer);

        if (strcmp(input_buffer->buffer, ".exit") == 0) {
            exit(EXIT_SUCCESS);
        } else {
            printf("Unrecognized command '%s' .\n", input_buffer->buffer);
        }
    }
}


// 运行: gcc -o repl repl.c
// (base) [root@bogon sqlitec]# ./repl 
// db > hi
// Unrecognized command 'hi' .
// db > .exit
// (base)

// Ref:
// [stdbool](https://zh.wikipedia.org/wiki/Stdbool.h)
// [stdio](https://zh.wikipedia.org/wiki/Stdio.h)
// size_t 表示大小的数据类型
// c++引入`iostream`进行输入输出,但仍保留了`stdio.h`的功能。贝尔实验室开发了Sfio库,旨在弥补`stdio.h`在功能,速度和安全性上的不足.
//
// struct
// [struct](https://zh.wikipedia.org/wiki/%E7%BB%93%E6%9E%84%E4%BD%93_(C%E8%AF%AD%E8%A8%80))
// struct 关键字 tag 结构体的标志 { member-list } 结构体成员列表 variable-list结构体声明的变量;
// 结构体成员访问:
// ```c
// struct SIMPLE
// {
//     int a;
//     char b;
// };
//
// struct SIMPLE s1, *s2;
// ```
//
// - 直接访问
// s1.a = 5
// - 间接访问
// s2->a = 3
//
// 想知道结构体占多少存储空间使用 sizeof  int size_sample = sizeof( struct SIMPLE );
// 想得知结构体的某个特定成员在结构体的位置,则使用offsetof(定义于stddef.h) int offset_b = offset( struct SIMPLE, b )
// 匿名struct类型作为嵌套定义,即在一个外部类(struct, union, class)的内部定义.
// 运行: gcc -o repl repl.c
// (base) [root@bogon sqlitec]# ./repl 
// db > hi
// Unrecognized command 'hi' .
// db > .exit
// (base)

// Ref:
// [stdbool](https://zh.wikipedia.org/wiki/Stdbool.h)
// [stdio](https://zh.wikipedia.org/wiki/Stdio.h)
// size_t 表示大小的数据类型
// c++引入`iostream`进行输入输出,但仍保留了`stdio.h`的功能。贝尔实验室开发了Sfio库,旨在弥补`stdio.h`在功能,速度和安全性上的不足.
//
// struct
// [struct](https://zh.wikipedia.org/wiki/%E7%BB%93%E6%9E%84%E4%BD%93_(C%E8%AF%AD%E8%A8%80))
// struct 关键字 tag 结构体的标志 { member-list } 结构体成员列表 variable-list结构体声明的变量;
// 结构体成员访问:
// ```c
// struct SIMPLE
// {
//     int a;
//     char b;
// };
//
// struct SIMPLE s1, *s2;
// ```
//
// - 直接访问
// s1.a = 5
// - 间接访问
// s2->a = 3
//
// 想知道结构体占多少存储空间使用 sizeof  int size_sample = sizeof( struct SIMPLE );
// 想得知结构体的某个特定成员在结构体的位置,则使用offsetof(定义于stddef.h) int offset_b = offset( struct SIMPLE, b )
// 匿名struct类型作为嵌套定义,即在一个外部类(struct, union, class)的内部定义.
