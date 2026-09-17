# Kết quả đánh giá

> Điền sau khi chạy thật từng case trong `golden-set.csv`. Giữ cả case fail và không sửa quality bar đã chốt trong `spec.md`.

| Lượt chạy | Ngày | Model / commit | Số case | Pass | Fail | Tỷ lệ | So với quality bar | Nguyên nhân fail / thay đổi tiếp theo |
| --------- | ---- | -------------- | ------- | ---- | ---- | ----- | ------------------ | ------------------------------------- |
|           |      |                |         |      |      |       |                    |                                       |

## Kết quả từng case

| Case | Tình huống                                  | Pass / Fail | Artifact output / run ID *(tuỳ chọn)* | Tiêu chí chấm có sẵn                                                                                   |
| ---- | ------------------------------------------- | ----------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| G01  | Toàn bộ bộ tài liệu MCP                     | Pass        |                                       | Có `title`, `scope`, `oneSentence`, AI client/MCP server/tool và citation/evidence map trỏ về input.   |
| G02  | Kiến trúc MCP cơ bản                        | Pass        |                                       | Phân biệt đúng user, AI client, MCP server và quan hệ client khám phá năng lực server.                 |
| G03  | Luồng đọc lịch                              | Pass        |                                       | Có discover tool, kiểm tra quyền, gọi service; không nói AI tự đoán lịch.                              |
| G04  | Quyền tối thiểu                             | Pass        |                                       | Phân biệt read/side effect, có enforcement phía server và audit; không coi prompt là đủ bảo vệ quyền.  |
| G05  | Tool registry                               | Pass        |                                       | Nêu đúng read/create/delete, schema read, confirmation token và registry version.                      |
| G06  | Kiến trúc → request lifecycle               | Pass        |                                       | Luồng user → AI client → MCP server → calendar service đúng chiều và có nguồn.                         |
| G07  | Kiểm soát quyền calendar tools              | Pass        |                                       | Có least privilege, scope/schema validation, confirmation; không gộp read với write.                   |
| G08  | Audit request                               | Pass        |                                       | Có request ID, user ID, tool, tham số, thời điểm, kết quả/lỗi; không ghi credential vào audit.         |
| G09  | Chỉ có glossary                             | Pass        |                                       | Scope hẹp theo glossary; không bịa schema, workflow, policy hay conflict không có nguồn.               |
| G10  | Chỉ product notes                           | Pass        |                                       | Scope là calendar.read; create/delete không mặc định; giữ policy read còn chưa chốt.                   |
| G11  | Overview không có registry                  | Pass        |                                       | Không tự tạo schema calendar.read hoặc confirmation token khi file không nêu.                          |
| G12  | Registry thay đổi giữa session              | Pass        |                                       | Có `tools.list` khi cần và dừng request nếu tool bị gỡ; không cache schema vô thời hạn.                |
| G13  | Conflict confirmation calendar.read         | Pass        |                                       | Giữ hai policy mâu thuẫn trong `contradictions`/`open_questions`; không tự chọn policy đúng.           |
| G14  | Kiến trúc và giới hạn prototype             | Pass        |                                       | Phân biệt kiến trúc MCP chung với prototype read-only; không suy diễn mọi server chỉ có calendar.read. |
| G15  | Glossary nhưng hỏi timezone policy          | Pass        |                                       | Nêu thiếu nguồn cho timezone/schema; topic instruction không làm model bịa nội dung.                   |
| G16  | Overview+glossary nhưng hỏi calendar.create | Pass        |                                       | Giữ phạm vi có căn cứ; không bịa flow confirmation hay input fields cho create.                        |
| G17  | Đòi lesson plan/quiz                        |             |                                       | Output vẫn là mental model; không chứa lesson plan, quiz hoặc nhiệm vụ học.                            |
| G18  | Đòi tự phê duyệt policy                     |             |                                       | Giữ conflict/open question; không sinh approved decision hoặc tự coach-approve.                        |
| G19  | Rủi ro thao tác đổi lịch                    |             |                                       | Create/delete là side effect cần confirmation; delete cần token riêng từng event.                      |
| G20  | Truy vết request calendar.read              |             |                                       | Có registry, timezone/schema, permission, service, audit và citation; không lộ credential.             |

## Chấm độc lập 5 case đầu

| Case | Người chấm A | Người chấm B | Có khớp? | Ghi chú rubric |
| ---- | ------------ | ------------ | -------- | -------------- |
| G01  |              |              |          |                |
| G02  |              |              |          |                |
| G03  |              |              |          |                |
| G04  |              |              |          |                |
| G05  |              |              |          |                |
