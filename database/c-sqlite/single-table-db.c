/*
    column| type
    id| integer
    username| varchar(32)
    email| varchar(255)

    insert 1 cstack foo@bar.com
*/ 

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

// 判断一个Command是不是一个成功的
enum MetaCommandResult_t {
    META_COMMAND_SUCCESS,
    META_COMMAND_UNRECOGNIZED_COMMAND
};
typedef enum MetaCommandResult_t MetaCommandResult;

// 某个command action 的执行状态
enum PrepareResult_t { PREPARE_SCCESS, PREPARE_UNRECOGNIZED_STATEMENT, PREPARE_SYSTAX_ERROR };
typedef enum PrepareResult_t PrepareResult;

// 列举支持的command action 列表;也就是所谓的bytecode
enum StatementType_t { STATEMENT_INSERT, STATEMENT_SELECT };
typedef enum StatementType_t StatementType;

const uint32_t COLUMN_USERNAME_SIZE = 32;
const unit32_t COLUMN_EMAIL_SIZE = 255;

struct Row_t {
    uint32_t id;
    char username[COLUMN_USERNAME_SIZE]；
    char email[COLUMN_EMAIL_SIZE];
}
typedef struct Row_t Row;

struct Statement_t {
    StatementType type;
    Row row_to_insert; 
};
typedef struct Statement_t Statement;

InputBuffer* new_input_buffer() {
    InputBuffer* input_buffer = malloc(sizeof(InputBuffer));
    input_buffer->buffer = NULL;
    input_buffer->buffer_length = 0;
    input_buffer->input_length = 0;

    return input_buffer;
}

MetaCommandResult do_meta_command(InputBuffer* input_buffer) {
    if (strcmp(input_buffer->buffer, ".exit") == 0) {
        exit(EXIT_SUCCESS);
    } else {
        return META_COMMAND_UNRECOGNIZED_COMMAND;
    }
}

PrepareResult prepare_statement(InputBuffer* input_buffer, Statement* statement) {
    if (strncmp(input_buffer->buffer, "insert", 6) == 0) {
        statement->type = STATEMENT_INSERT;
        // 需要更新prepare_statement function to parse arguments
        int args_assigned = sscanf(
            input_buffer->buffer, 
            "insert %d %s %s",
            &(statement->row_to_insert.id),
            &(statement->row_to_insert.username),
            &(statement->row_to_insert.email)
        )

        if (args_assigned < 3) {
            return PREPARE_SYSTAX_ERROR;
        }

        return PREPARE_SCCESS;
    }

    if (strcmp(input_buffer->buffer, "select") == 0) {
        statement->type = STATEMENT_SELECT;
        return PREPARE_SCCESS;
    }

    return PREPARE_UNRECOGNIZED_STATEMENT;
}

void execute_statement(Statement* statement) {
    switch (statement->type) {
        case (STATEMENT_INSERT):
            printf("This is where we would do an insert.\n");
            break;
        case (STATEMENT_SELECT):
            printf("This is where we would do a select.\n");
            break;
    }
}

int main(int argc, char* argv[]) {
    InputBuffer* input_buffer = new_input_buffer();
    while (true) {
        print_prompt();
        read_input(input_buffer);

        // if (strcmp(input_buffer->buffer, ".exit") == 0) {
        //     exit(EXIT_SUCCESS);
        // } else {
        //     printf("Unrecognized command '%s' .\n", input_buffer->buffer);
        // }
        
        // step1 做输入meta_command 的过滤,看是否属于builtin 命令,比如.help; .show;.tables;等
        if (input_buffer->buffer[0] == ".") {
            switch (do_meta_command(input_buffer)) {
                case (META_COMMAND_SUCCESS):
                    continue;
                case (META_COMMAND_UNRECOGNIZED_COMMAND):
                    printf("Unrecognized command '%s' \n", input_buffer->buffer);
                    continue;
            }
        }

        // step2 分析输入的关键字是否是builtin 关键字,并给出判断结果
        Statement statement;
        switch (prepare_statement(input_buffer, &statement)) {
            case (PREPARE_SUCCESS):
                break;
            case (PREPARE_UNRECOGNIZED_STATEMENT):
                printf("Unrecognized keyword at start of '%s ' .\n", input_buffer->buffer);
                continue;
        }

        // setp3 进行命令的执行
        execute_statement(&statement);
        printf("Executed.\n");
    }
}


/*
现在我们需要将数据拷入到这个表里对应的数据结构了,SQLite使用B-tree进行快速查找,插入和删除.
我们将以一个简单的相似于B-tree的数据结构,它将会把rows划分为pages,但并不是将pages以tree的形式进行组织,而是以array的形式.


*/