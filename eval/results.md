# Kết quả đánh giá

> Điền sau khi chạy thật từng case trong `golden-set.csv`. Giữ cả case fail và không sửa quality bar đã chốt trong `spec.md`.

| Lượt chạy | Ngày | Model / commit | Số case | Pass | Fail | Tỷ lệ | So với quality bar | Nguyên nhân fail / thay đổi tiếp theo |
| --------- | ---- | -------------- | ------- | ---- | ---- | ----- | ------------------ | ------------------------------------- |
|           |      |                |         |      |      |       |                    |                                       |

## Kết quả từng case

| Case | Tình huống                          | Pass / Fail | Artifact output / run ID *(tuỳ chọn)* | Tiêu chí chấm có sẵn                                                                  |
| ---- | ----------------------------------- | ----------- | ------------------------------------- | ------------------------------------------------------------------------------------- |
| G01  | API nhận file và tạo run            | Pass        |                                       | HTTP 202 và response có `runId` không rỗng.                                           |
| G02  | Job hoàn tất khi polling            | Pass        |                                       | `status` là `SUCCEEDED`, không phải `FAILED`.                                         |
| G03  | Result trả JSON mental model        | Pass        |                                       | Response parse được JSON và `mentalModel` là object.                                  |
| G04  | Mental model có tiêu đề             | Pass        |                                       | `mentalModel.title` không rỗng.                                                       |
| G05  | Mental model có phạm vi             | Pass        |                                       | `mentalModel.scope` không rỗng.                                                       |
| G06  | Mental model có một câu mô tả       | Pass        |                                       | `mentalModel.oneSentence` không rỗng.                                                 |
| G07  | Mental model có danh sách entity    | Pass        |                                       | `mentalModel.core_entities` là array.                                                 |
| G08  | Workflow/cơ chế có cấu trúc         | Pass        |                                       | `causal_mechanism` hoặc `main_workflows` là array không rỗng.                         |
| G09  | Backend lưu artifact lượt chạy      | Pass        |                                       | Run có `manifest.json`, `facts.jsonl`, `mental-model.json`, `validation-report.json`. |
| G10  | Output render và validation         | Pass        |                                       | `renderedHtml` không rỗng và validation trả JSON object.                              |
| G11  | Kiến trúc MCP cơ bản                | Pass        |                                       | Không nhầm MCP server là model hoặc backend là AI client.                             |
| G12  | Luồng đọc lịch                      | Pass        |                                       | Có discover tool, kiểm tra quyền, gọi service; không nói AI tự đoán lịch.             |
| G13  | Quyền tối thiểu và xác nhận         | Pass        |                                       | Không coi prompt một mình là lớp bảo vệ quyền.                                        |
| G14  | Tool registry                       | Pass        |                                       | Read không thay đổi dữ liệu; create/delete cần confirmation.                          |
| G15  | Conflict confirmation calendar.read | Pass        |                                       | Có `contradictions` hoặc `open_questions`; không tự chọn policy đúng.                 |
| G16  | Glossary nhưng hỏi calendar.create  | Pass        |                                       | Không bịa schema/create flow; nêu giới hạn hoặc câu hỏi mở.                           |
| G17  | Overview không có registry          | Pass        |                                       | Không tự tạo schema calendar.read hoặc confirmation token khi source không nêu.       |
| G18  | Đòi lesson plan/quiz                | Fail        |                                       | Không chứa lesson plan, quiz hoặc nhiệm vụ học.                                       |
| G19  | Rủi ro thao tác đổi lịch            | Fail        |                                       | Delete cần token riêng mỗi event; không nói read có side effect.                      |
| G20  | Truy vết request calendar.read      | Fail        |                                       | Không khẳng định khoảng trống khi server chưa trả data; không lộ credential.          |

## Chấm độc lập 5 case đầu

| Case | Người chấm A | Người chấm B | Có khớp? | Ghi chú rubric |
| ---- | ------------ | ------------ | -------- | -------------- |
| G01  |              |              |          |                |
| G02  |              |              |          |                |
| G03  |              |              |          |                |
| G04  |              |              |          |                |
| G05  |              |              |          |                |
