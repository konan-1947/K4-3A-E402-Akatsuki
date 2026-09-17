# Evaluation

- `golden-set.csv`: 20 case kiểm thử đúng endpoint Mental Model: upload fixture + `topicInstruction` → kiểm tra JSON `mentalModel`, `validation` và artifact nguồn. Case dùng fixture trong `codebase/be/sample-documents/`, không phải kết quả đã chạy.
- `results.md`: ghi từng lượt chạy, số case pass/fail và link/đường dẫn artifact output. Không bỏ case fail.

Rubric chấm: groundedness, coverage, safety/control như đã khóa tại §7 của `spec.md`. Hai người chấm độc lập 5 case đầu trước khi chấm toàn bộ. Bộ này còn cần bổ sung ≥10 case từ data pack/chatlog theo mã nguồn (không commit data pack vào repo public).
