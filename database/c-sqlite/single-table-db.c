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

/* struct typedef */ 
const uint32_t COLUMN_USERNAME_SIZE = 32;
const unit32_t COLUMN_EMAIL_SIZE = 255;

/*
    id| username| email
*/ 
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

#define size_of_attribute(Struct, Attribute) sizeof( (((Struct*)0)->Attribute) )

/* 0 
ID_SIZE + ID_OFFSET = USERNAME_OFFSET 
USERNAME_SIZE + USERNAME_OFFSET = EMAIL_OFFSET
*/ 
const uint32_t ID_SIZE = size_of_attribute(ROW, id);
const uint32_t USERNAME_SIZE = size_of_attribute(ROW, username);
const uint32_t EMAIL_SIZE = size_of_attribute(ROW, email);
const uint32_t ID_OFFSET = 0;
const uint32_t USERNAME_OFFSET = ID_OFFSET +ID_SIZE;
const uint32_t EMAIL_OFFSET = USERNAME_OFFSET + USERNAME_SIZE;
const uint32_t ROW_SIZE = ID_SIZE + USERNAME_SIZE + EMAIL_SIZE;

const uint32_t PAGE_SIZE = 4096;
const uint32_t TABLE_MAX_PAGES = 100;
const uint32_t ROW_PER_PAGE = PAGE_SIZE / ROW_SIZE;
const uint32_t TABLE_MAX_ROWS = ROWS_PER_PAGE * TABLE_MAX_PAGES;

struct Table_t {
    void* pages[TABLE_MAX_PAGES];
    uint32_t num_rows;
};
typedef struct Table_t Table;


struct InputBuffer_t {
    char* buffer;
    size_t buffer_length;
    ssize_t input_length;
};

typedef struct InputBuffer_t InputBuffer;


/* struct typedef end */ 


/* enum DataStruct */ 

enum ExecuteResult_t {
    EXECUTE_SUCCESS, 
    EXECUTE_TABLE_FULL
};
typedef enum ExecuteResult_t ExecuteResult;


// 判断一个Command是不是一个成功的
enum MetaCommandResult_t {
    META_COMMAND_SUCCESS,
    META_COMMAND_UNRECOGNIZED_COMMAND
};
typedef enum MetaCommandResult_t MetaCommandResult;

// 列举支持的command action 列表;也就是所谓的bytecode
enum StatementType_t { STATEMENT_INSERT, STATEMENT_SELECT };
typedef enum StatementType_t StatementType;

// 某个command action 的执行状态
enum PrepareResult_t { 
    PREPARE_SCCESS, 
    PREPARE_SYSTAX_ERROR,
    PREPARE_UNRECOGNIZED_STATEMENT
};
typedef enum PrepareResult_t PrepareResult;

/* enum DataStruct ends */

MetaCommandResult do_meta_command(InputBuffer* input_buffer) {
    if (strcmp(input_buffer->buffer, ".exit") == 0) {
        exit(EXIT_SUCCESS);
    } else {
        return META_COMMAND_UNRECOGNIZED_COMMAND;
    }
}

InputBuffer* new_input_buffer() {
    InputBuffer* input_buffer = malloc(sizeof(InputBuffer));
    input_buffer->buffer = NULL;
    input_buffer->buffer_length = 0;
    input_buffer->input_length = 0;

    return input_buffer;
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

void serialize_row(void* source, Row* destination) {
    memcpy(destination + ID_OFFSET, &(destination->id) , ID_SIZE);
    memcpy(destination + USERNAME_OFFSET, &(destination->username) , USERNAME_SIZE);
    memcpy(destination + EMAIL_OFFSET, &(destination->email) , EMAIL_SIZE);
}

void deserialize_row(void* source, Row* destination) {
    memcpy(&(destination->id), source + ID_OFFSET , ID_SIZE);
    memcpy(&(destination->username), source + USERNAME_OFFSET , USERNAME_SIZE);
    memcpy(&(destination->email), source + EMAIL_OFFSET , EMAIL_SIZE);
}

void* row_slot(Table* table, uint32_t row_num) {
    uint32_t page_num = row_num / ROWS_PER_PAGE;
    void* page = table->pages[page_num];
    if(!page) {
        // Allocate memory only when we try to access page
        page = table->pages[page_num] = malloc(PAGE_SIZE);
    }

    uint32_t row_offset = row_num % ROW_PER_PAGE;
    uint32_t byte_offset = row_offset * ROW_SIZE;
    return page + byte_offset;
}

Table* new_table() {
    Table* table = malloc(sizeof(Table));
    table->num_rows = 0;

    return table;
}

// void execute_statement(Statement* statement) {
//     switch (statement->type) {
//         case (STATEMENT_INSERT):
//             printf("This is where we would do an insert.\n");
//             break;
//         case (STATEMENT_SELECT):
//             printf("This is where we would do a select.\n");
//             break;
//     }
// }

ExecuteResult execute_insert(Statement* statement, Table* table) {
    if (table->num_rows >= TABLE_MAX_ROWS) {
        return EXECUTE_TABLE_FULL;
    }

    Row* row_to_insert = &(statement->row_to_insert);

    serialize_row(row_to_insert, row_slot(table, table->num_rows));

    table->num_rows += 1;

    return EXECUTE_SUCCESS;
}

ExecuteResult execute_select(Statement* statement, Table* table) {
    Row row;
    for (uint32_t i = 0; i < table->num_rows; i++) {
        descrialize_row(row_slot(table, i), &row);
        print_row(&row);
    }

    return EXECUTE_SUCCESS;
}

ExecuteResult execute_statement(Statement* statement, Table* table) {
    switch(statement->type) {
        case (STATEMENT_INSERT):
            return execute_insert(statement, table);
        case (STATEMENT_SELECT):
            return execte_select(statement, table);
    }
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

void print_row(Row* row) {
    printf("(%d, %s, %s)\n", row->id, row->username, row->email);
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
            case (PREPARE_SYSTAX_ERROR):
                printf("Synatax error. Could not parse statement.\n");
                continue;
            case (PREPARE_UNRECOGNIZED_STATEMENT):
                printf("Unrecognized keyword at start of '%s ' .\n", input_buffer->buffer);
                continue;
        }

        // setp3 进行命令的执行
        // execute_statement(&statement);
        // printf("Executed.\n");

        switch (execute_statement(&statement, table)) {
            case (EXECUTE_SUCCESS):
                printf("Executed. \n");
                break;
            case (EXECUTE_TABLE_FULL):
                printf("Error: table full.\n");
                break;
        }
    }
}


/*
现在我们需要将数据拷入到这个表里对应的数据结构了,SQLite使用B-tree进行快速查找,插入和删除.
我们将以一个简单的相似于B-tree的数据结构,它将会把rows划分为pages,但并不是将pages以tree的形式进行组织,而是以array的形式.


> Refrence
[memcpy c++](https://baike.baidu.com/item/memcpy)
*/