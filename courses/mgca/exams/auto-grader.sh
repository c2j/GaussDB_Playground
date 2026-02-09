#!/bin/bash
# MGCA GaussDB 认证课程 - 自动化评分脚本
# 用于自动评分笔试和实操考试

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COURSE_DIR="$(dirname "$SCRIPT_DIR")"
EXAMS_DIR="$COURSE_DIR/exams"
RESULTS_DIR="$COURSE_DIR/exams/results"
LOG_DIR="$COURSE_DIR/exams/logs"

# 创建必要的目录
mkdir -p "$RESULTS_DIR" "$LOG_DIR"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/grading.log"
}

# 加载考试题库
load_questions() {
    local question_file="$1"
    if [[ ! -f "$question_file" ]]; then
        log "ERROR: Question file not found: $question_file"
        exit 1
    fi
    cat "$question_file"
}

# 评分笔试（单选题）
grade_single_choice() {
    local question_id="$1"
    local user_answer="$2"
    local correct_answer="$3"
    local points_per_question="${4:-5}"

    log "Grading single choice question: $question_id"
    log "User answer: $user_answer, Correct answer: $correct_answer"

    if [[ "$user_answer" == "$correct_answer" ]]; then
        echo "$points_per_question"
        return 0
    else
        echo "0"
        return 1
    fi
}

# 评分笔试（多选题）
grade_multiple_choice() {
    local question_id="$1"
    local user_answer="$2"
    local correct_answer="$3"
    local points_per_question="${4:-8}"

    log "Grading multiple choice question: $question_id"
    log "User answer: $user_answer, Correct answer: $correct_answer"

    # 将答案转换为排序后的数组进行比较
    local user_sorted=$(echo "$user_answer" | tr ',' '\n' | sort | tr '\n' ',' | sed 's/,$//')
    local correct_sorted=$(echo "$correct_answer" | jq -r 'join(",")' | sort | tr '\n' ',' | sed 's/,$//')

    if [[ "$user_sorted" == "$correct_sorted" ]]; then
        echo "$points_per_question"
        return 0
    else
        # 部分正确给一半分数
        local user_count=$(echo "$user_sorted" | tr ',' '\n' | wc -l | xargs)
        local correct_count=$(echo "$correct_sorted" | tr ',' '\n' | wc -l | xargs)
        local correct_matches=$(comm -12 <(echo "$user_sorted" | tr ',' '\n' | sort) <(echo "$correct_sorted" | tr ',' '\n' | sort) | wc -l | xargs)
        local partial_score=$((points_per_question * correct_matches / correct_count))
        echo "$partial_score"
        return 1
    fi
}

# 评分分析题（需要人工评分或关键词匹配）
grade_analysis() {
    local question_id="$1"
    local user_answer="$2"
    local sample_answer="$3"
    local points_per_question="${4:-12}"

    log "Grading analysis question: $question_id"
    log "User answer: $user_answer"
    log "Sample answer: $sample_answer"

    # 简单的关键词匹配评分（可以后续升级为 AI 评分）
    local score=0
    local keyword_count=0

    # 从示例答案中提取关键词
    local keywords=$(echo "$sample_answer" | grep -oE '\b[a-zA-Z\u4e00-\u9fa5]{2,}\b' | head -10)

    while IFS= read -r keyword; do
        if [[ -n "$keyword" ]] && echo "$user_answer" | grep -qi "$keyword"; then
            ((keyword_count++))
        fi
    done <<< "$keywords"

    # 根据关键词匹配度给分
    score=$((points_per_question * keyword_count / 10))
    if [[ $score -gt $points_per_question ]]; then
        score=$points_per_question
    fi

    echo "$score"
    return 0
}

# 评分笔试（主函数）
grade_written_test() {
    local user_answers_file="$1"
    local question_file="$EXAMS_DIR/exam-questions-full.json"
    local result_file="$RESULTS_DIR/written_test_result.json"
    local result_summary_file="$RESULTS_DIR/written_test_summary.txt"

    log "Starting written test grading..."

    # 加载题库
    local questions=$(load_questions "$question_file")

    # 初始化分数
    local total_score=0
    local max_score=0
    local results='{"questions": []}'

    # 处理用户答案（假设格式为 JSON）
    if [[ ! -f "$user_answers_file" ]]; then
        log "ERROR: User answers file not found: $user_answers_file"
        exit 1
    fi

    local user_answers=$(cat "$user_answers_file")

    # 评分单选题
    local single_choice_count=$(echo "$questions" | jq '.written_test.single_choice | length')
    for ((i=0; i<single_choice_count; i++)); do
        local qid=$(echo "$questions" | jq -r ".written_test.single_choice[$i].id")
        local correct=$(echo "$questions" | jq -r ".written_test.single_choice[$i].answer")
        local user_ans=$(echo "$user_answers" | jq -r --arg qid "$qid" '.single_choice[$qid] // ""')
        local points=$(echo "$questions" | jq -r ".metadata.exam_config.written_test.passing_score")

        local score=$(grade_single_choice "$qid" "$user_ans" "$correct" "$points")
        total_score=$((total_score + score))
        max_score=$((max_score + points))

        results=$(echo "$results" | jq --arg qid "$qid" --arg score "$score" --arg user_ans "$user_ans" --arg correct "$correct" \
            '.questions += [{"id": $qid, "type": "single_choice", "user_answer": $user_ans, "correct_answer": $correct, "score": $score}]')
    done

    # 评分多选题
    local multiple_choice_count=$(echo "$questions" | jq '.written_test.multiple_choice | length')
    for ((i=0; i<multiple_choice_count; i++)); do
        local qid=$(echo "$questions" | jq -r ".written_test.multiple_choice[$i].id")
        local correct=$(echo "$questions" | jq -r ".written_test.multiple_choice[$i].answer | join(\",\")")
        local user_ans=$(echo "$user_answers" | jq -r --arg qid "$qid" '.multiple_choice[$qid] // ""')
        local points=8

        local score=$(grade_multiple_choice "$qid" "$user_ans" "$correct" "$points")
        total_score=$((total_score + score))
        max_score=$((max_score + points))

        results=$(echo "$results" | jq --arg qid "$qid" --arg score "$score" --arg user_ans "$user_ans" --arg correct "$correct" \
            '.questions += [{"id": $qid, "type": "multiple_choice", "user_answer": $user_ans, "correct_answer": $correct, "score": $score}]')
    done

    # 评分分析题
    local analysis_count=$(echo "$questions" | jq '.written_test.analysis | length')
    for ((i=0; i<analysis_count; i++)); do
        local qid=$(echo "$questions" | jq -r ".written_test.analysis[$i].id")
        local sample=$(echo "$questions" | jq -r ".written_test.analysis[$i].answer")
        local user_ans=$(echo "$user_answers" | jq -r --arg qid "$qid" '.analysis[$qid] // ""')
        local points=12

        local score=$(grade_analysis "$qid" "$user_ans" "$sample" "$points")
        total_score=$((total_score + score))
        max_score=$((max_score + points))

        results=$(echo "$results" | jq --arg qid "$qid" --arg score "$score" --arg user_ans "$user_ans" \
            '.questions += [{"id": $qid, "type": "analysis", "user_answer": $user_ans, "score": $score}]')
    done

    # 生成结果 JSON
    results=$(echo "$results" | jq --arg total_score "$total_score" --arg max_score "$max_score" \
        '{total_score: ($total_score | tonumber), max_score: ($max_score | tonumber), percentage: (($total_score / $max_score * 100) | floor), passed: (($total_score / $max_score * 100) >= 80), questions: .questions}')

    echo "$results" > "$result_file"
    log "Written test result saved to: $result_file"

    # 生成文本摘要
    cat > "$result_summary_file" << EOF
# 笔试评分结果

- **总分**: $total_score / $max_score
- **得分率**: $((total_score * 100 / max_score))%
- **及格状态**: $((total_score * 100 / max_score >= 80 ? "及格" : "不及格"))
- **及格线**: 80%

## 详细得分

EOF

    echo "$results" | jq -r '.questions[] | "### \(.type) - \(.id)\n- 用户答案: \(.user_answer)\n- 正确答案: \(.correct_answer // "N/A")\n- 得分: \(.score)\n"' >> "$result_summary_file"

    log "Written test summary saved to: $result_summary_file"
    echo "$result_file"
}

# 评分实操考试（主函数）
grade_practical_exam() {
    local task_id="$1"
    local submission_dir="$2"
    local result_file="$RESULTS_DIR/practical_exam_${task_id}_result.json"

    log "Starting practical exam grading for task: $task_id"

    if [[ ! -d "$submission_dir" ]]; then
        log "ERROR: Submission directory not found: $submission_dir"
        exit 1
    fi

    # 加载任务配置
    local tasks=$(cat "$EXAMS_DIR/exam-questions-full.json" | jq ".practical_exam.tasks[] | select(.id == \"$task_id\")")

    local task_title=$(echo "$tasks" | jq -r '.title')
    local scoring=$(echo "$tasks" | jq -r '.scoring')
    local checklist=$(echo "$tasks" | jq -r '.checklist')

    log "Task title: $task_title"
    log "Scoring scheme: $scoring"

    # 初始化分数
    local correctness_score=0
    local performance_score=0
    local norm_score=0
    local documentation_score=0

    # 检查提交内容
    local has_submission=false

    # 检查 SQL 文件
    if [[ -f "$submission_dir"/*.sql ]]; then
        log "Found SQL submission files"
        has_submission=true

        # 验证 SQL 语法
        local sql_files=("$submission_dir"/*.sql)
        for sql_file in "${sql_files[@]}"; do
            log "Validating SQL file: $sql_file"

            # 检查是否有语法错误（简单检查）
            if grep -qE "^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT)" "$sql_file"; then
                local correctness_weight=$(echo "$scoring" | jq '.correctness')
                correctness_score=$((correctness_score + correctness_weight))
                log "SQL file validated, added $correctness_weight points to correctness"
            fi
        done
    fi

    # 检查文档
    if [[ -f "$submission_dir"/*.{md,txt,doc,docx} ]]; then
        log "Found documentation files"
        has_submission=true

        local doc_files=("$submission_dir"/*.{md,txt,doc,docx})
        for doc_file in "${doc_files[@]}"; do
            log "Found documentation: $doc_file"

            # 检查文档长度
            local doc_length=$(wc -l < "$doc_file" 2>/dev/null || echo 0)
            if [[ $doc_length -gt 10 ]]; then
                local doc_weight=$(echo "$scoring" | jq '.documentation')
                documentation_score=$((documentation_score + doc_weight))
                log "Documentation verified, added $doc_weight points to documentation"
            fi
        done
    fi

    # 检查脚本文件
    if [[ -f "$submission_dir"/*.sh ]]; then
        log "Found shell script files"
        has_submission=true

        local script_files=("$submission_dir"/*.sh)
        for script_file in "${script_files[@]}"; do
            log "Validating script file: $script_file"

            # 检查脚本可执行性和语法
            if [[ -x "$script_file" ]] && bash -n "$script_file" 2>/dev/null; then
                local perf_weight=$(echo "$scoring" | jq '.performance')
                performance_score=$((performance_score + perf_weight))
                log "Script validated, added $perf_weight points to performance"
            fi
        done
    fi

    # 规范性评分（检查命名规范、注释等）
    if [[ "$has_submission" == true ]]; then
        local norm_weight=$(echo "$scoring" | jq '.norm')
        local norm_bonus=0

        # 检查注释
        if grep -rqE "(#|--|//)" "$submission_dir"/* 2>/dev/null; then
            ((norm_bonus+=norm_weight/2))
        fi

        # 检查命名规范（简单检查）
        if grep -rqE "(CREATE TABLE|CREATE FUNCTION)" "$submission_dir"/*.sql 2>/dev/null; then
            ((norm_bonus+=norm_weight/2))
        fi

        norm_score=$norm_bonus
        log "Norm score: $norm_score"
    fi

    # 计算总分
    local total_score=$((correctness_score + performance_score + norm_score + documentation_score))
    local max_score=$(echo "$scoring" | jq 'to_entries | map(.value) | add')

    # 生成结果
    local result_json=$(cat << EOF
{
  "task_id": "$task_id",
  "task_title": "$task_title",
  "scores": {
    "correctness": $correctness_score,
    "performance": $performance_score,
    "norm": $norm_score,
    "documentation": $documentation_score
  },
  "total_score": $total_score,
  "max_score": $max_score,
  "percentage": $((total_score * 100 / max_score)),
  "passed": $((total_score * 100 / max_score >= 80)),
  "has_submission": $has_submission,
  "submitted_at": "$(date -Iseconds)"
}
EOF
)

    echo "$result_json" > "$result_file"
    log "Practical exam result saved to: $result_file"

    echo "$result_file"
}

# 生成学员报告
generate_learner_report() {
    local learner_id="$1"
    local learner_name="$2"
    local written_result="$3"
    local practical_results="$4"
    local output_file="$RESULTS_DIR/learner_report_${learner_id}.md"

    log "Generating learner report for: $learner_name ($learner_id)"

    # 读取笔试结果
    local written_score=$(cat "$written_result" | jq -r '.total_score')
    local written_max=$(cat "$written_result" | jq -r '.max_score')
    local written_percent=$(cat "$written_result" | jq -r '.percentage')

    # 读取实操结果
    local practical_total=0
    local practical_max=0
    local practical_count=$(echo "$practical_results" | jq 'length')

    for ((i=0; i<practical_count; i++)); do
        local task_result=$(echo "$practical_results" | jq ".[$i]")
        practical_total=$((practical_total + $(echo "$task_result" | jq -r '.total_score')))
        practical_max=$((practical_max + $(echo "$task_result" | jq -r '.max_score')))
    done

    local practical_percent=$((practical_total * 100 / practical_max))

    # 计算综合成绩
    local combined_percent=$(( (written_percent + practical_percent) / 2 ))

    # 生成报告（基于模板）
    cp "$EXAMS_DIR/learner-report-template.md" "$output_file"

    # 替换占位符
    sed -i.bak "s/_______________/$learner_name/g" "$output_file"

    # 填充笔试成绩
    sed -i.bak "/笔试总分/c\\- **总分**: $written_score/$written_max\\n- **实际得分**: $written_score/$written_max\\n- **得分率**: $written_percent%\\n- **及格状态**: $([[ $written_percent -ge 80 ]] && echo "及格" || echo "不及格")" "$output_file"

    # 填充实操成绩
    sed -i.bak "/实操总分/c\\- **总分**: $practical_total/$practical_max\\n- **实际得分**: $practical_total/$practical_max\\n- **得分率**: $practical_percent%\\n- **及格状态**: $([[ $practical_percent -ge 80 ]] && echo "及格" || echo "不及格")" "$output_file"

    # 填充综合成绩
    sed -i.bak "/综合得分/c\\- **综合得分**: $combined_percent/100\\n- **综合及格状态**: $([[ $combined_percent -ge 80 ]] && echo "及格" || echo "不及格")" "$output_file"

    rm "${output_file}.bak"

    log "Learner report saved to: $output_file"
    echo "$output_file"
}

# 主函数
main() {
    local command="$1"
    shift

    case "$command" in
        written)
            local answers_file="$1"
            grade_written_test "$answers_file"
            ;;
        practical)
            local task_id="$1"
            local submission_dir="$2"
            grade_practical_exam "$task_id" "$submission_dir"
            ;;
        report)
            local learner_id="$1"
            local learner_name="$2"
            local written_result="$3"
            shift 3
            local practical_results=("$@")
            generate_learner_report "$learner_id" "$learner_name" "$written_result" "$(printf '%s\n' "${practical_results[@]}" | jq -s '.')"
            ;;
        *)
            echo "Usage: $0 {written|practical|report} [args...]"
            echo ""
            echo "Commands:"
            echo "  written <answers_file>           Grade written test"
            echo "  practical <task_id> <submission_dir>  Grade practical exam"
            echo "  report <learner_id> <name> <written_result> <practical_result1> [practical_result2 ...]  Generate learner report"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
