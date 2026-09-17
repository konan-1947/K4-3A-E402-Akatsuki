# AI SPEC — StudyPulse: Mental Model từ tài liệu rời rạc · Nhóm Akatsuki · E402

Hướng: [x] A — VLearn · Loại: [x] Tính năng mới

> **Trạng thái CP4 (17/09/2026):** Chốt phạm vi và quality bar bên dưới. Prototype đã có luồng upload → trích xuất → tổng hợp → duyệt. Evidence người dùng là một phỏng vấn định tính; kết quả eval chưa có và được khai ở §7, §9, không suy diễn thành kết quả đã có.

## §1. User & Job

- **Job executor + workflow:** Lab coach chuẩn bị tài liệu học cho học viên. Khi cần biến slide, transcript và bài lab thành tài liệu giải thích một concept, coach đang đọc/tổng hợp nhiều nguồn, dùng AI tạo bản nháp rồi phải tự kiểm tra trước khi đưa cho học viên.
- **Core JTBD:** Khi các tài liệu giảng dạy rời rạc, giúp tôi ghép đúng các khái niệm, quan hệ và điều kiện từ nguồn đã chọn để tôi có thể tạo một tài liệu học dễ hiểu mà không bỏ sót hoặc làm sai ý quan trọng.
- **Problem statement:** Tài liệu, video và thuật ngữ hiện rời rạc; lab coach tốn thời gian tổng hợp và review, trong khi học viên vẫn phải tua/tra cứu nhiều nơi để dựng mental model.

### Evidence

**Nghiên cứu định tính — một phỏng vấn sâu.** Nguồn: [interview-log.md](interview-log.md), Lab coach HaiDM, 16/09/2026. Mục tiêu là hiểu workflow, pain và hậu quả trong trải nghiệm của một lab coach; đây không phải khảo sát định lượng và không dùng để khẳng định tỷ lệ đại diện cho toàn bộ người dùng.

Người được phỏng vấn mô tả:

1. “Tài liệu không liên kết (các phần rời rạc, các thuật ngữ không có giải thích).”
2. Video không trực quan nên phải tua lại, làm việc ôn tập mất thời gian.
3. Bài lab, slide và script không đồng nhất, nên khó gộp thành kiến thức có cấu trúc.
4. Không đủ thời gian để vừa tạo vừa review tài liệu do AI sinh.
5. Một đầu ra có text, hình/diagram và mô phỏng sẽ giúp học viên hiểu mental model mà ít phải tra cứu thêm.

**Insight đưa vào thiết kế:** thay vì trả một bản tóm tắt tự do, StudyPulse giữ fact có source, hiển thị conflict/open question và để lab coach duyệt trước khi dùng kết quả. Điều này trực tiếp giảm gánh nặng ghép nguồn và review mà người được phỏng vấn nêu ra.

## §2. Impact & quyết định chọn

| Ứng viên pain | Bằng chứng định tính | Hệ quả quan sát | Khả thi trong hackathon | Quyết định |
| --- | --- | --- | --- | --- |
| Tài liệu thiếu liên kết/thuật ngữ khiến khó dựng mental model | Lab coach mô tả tài liệu rời rạc, thiếu giải thích thuật ngữ và khó gộp lab–slide–script | Phải đọc/đối chiếu nhiều nguồn; dễ đứt mạch kiến thức | Cao: dùng upload + citation + review | **Chọn** |
| Video không trực quan, phải tua lại | Lab coach cho biết người học phải tua lại video để tìm phần cần hiểu | Tốn thời gian ôn tập và tìm ngữ cảnh | Trung bình: cần video/timestamp và UX player | Loại khỏi lát cắt |
| Thiếu thời gian review nội dung AI sinh | Lab coach nêu không đủ thời gian để vừa tạo vừa review đầu ra AI | Rủi ro dùng tài liệu chưa được kiểm tra | Trung bình: cần workflow duyệt | Giải quyết một phần bằng evidence/approval |

- **Ứng viên đã loại:** xây video player/tự tạo multimedia hoàn chỉnh. Lý do: phụ thuộc asset và timestamp, vượt thời gian hackathon; không trực tiếp xử lý điểm gốc là claim thiếu căn cứ giữa nhiều nguồn.
- **Lý do chọn:** prototype hiện xử lý đúng đường có thể demo trong 5 phút: upload nhiều tài liệu → fact có nguồn → mental model → coach duyệt. Quyết định dựa trên workflow và pain mà lab coach mô tả trong phỏng vấn.

## §3. Giải pháp tương tự đã nghiên cứu

| Sản phẩm/cách làm | Đáng học | Khác biệt/giới hạn của StudyPulse |
| --- | --- | --- |
| Tóm tắt bằng một prompt LLM | Nhanh, dễ bắt đầu | Không dùng một prompt cho toàn bộ corpus; tách chunk/fact/domain để giữ đường truy vết. |
| RAG/chat với tài liệu | Truy hồi đoạn nguồn theo câu hỏi | Không build chatbot trong V1; sản phẩm là một mental model có cấu trúc để coach duyệt trước. |
| Tự viết lesson thủ công | Quyền kiểm soát và chịu trách nhiệm rõ | Giảm việc ghép nguồn ban đầu, nhưng coach vẫn duyệt bản chuẩn trước khi tạo lesson. |

## §4. Thiết kế

- **Lát cắt một câu:** Một lab coach có nhiều tài liệu về một concept; AI trích facts có source, tổng hợp thành mental model và hiển thị conflict/open question để coach duyệt một bản có căn cứ.
- **Non-goals:**
  1. Không là chatbot hỏi đáp hoặc hệ thống RAG runtime.
  2. Không tự quyết định nguồn nào đúng khi các nguồn mâu thuẫn.
  3. Không tự xuất bản lesson cho học viên khi chưa có coach approval.
  4. Không xử lý OCR/scan chất lượng kém trong phạm vi demo.
- **Mức prototype:** [x] Working. Luồng thật: parse file, chunk theo cấu trúc, gọi AI để extract JSON/fact và synthesize mental model, validate và lưu artifact. Không có database/authentication; PDF/DOCX phụ thuộc Apache Tika và chưa có bộ test fixture riêng.
- **Automation:** [x] conditional/augment. AI làm bản nháp có evidence; coach kiểm tra, sửa và gọi `approve` trước khi dùng tiếp. Cost of error cao vì sai kiến thức có thể khiến học viên hiểu sai.

### §4b. Nguyên tắc đã áp dụng

| Nguyên tắc HAX/PAIR | Áp cụ thể vào đâu |
| --- | --- |
| G1 — Làm rõ hệ thống làm được gì | Màn upload chỉ mô tả việc tổng hợp từ file được chọn; `MENTAL-MODEL-WORKFLOW.md` ghi rõ scope V1 và non-goals. |
| G2 / Explainability + Trust | Mỗi fact/kết luận yêu cầu `source`, `explicit`/`inferred`, citations/evidence map; validator cảnh báo thiếu citation. |
| Feedback + Control | Coach xem và sửa mental model, chỉ endpoint `POST /approve` mới lưu canonical approved version; không tự xuất bản. |
| Errors + Graceful Failure | Parse lỗi, JSON AI lỗi sau retry, hoặc toàn bộ provider lỗi đều trả trạng thái `FAILED`/error để người dùng thử lại; không trả output một phần như kết quả chắc chắn. |
| Mental models / đặt kỳ vọng đúng | UI/workflow thể hiện các bước extracting → normalizing → synthesizing, đồng thời ghi conflict, assumption và open question thay vì hứa một đáp án tuyệt đối. |

## §5. Kiểu lỗi — 4 lớp chỗ khó và kịch bản

| ID | Tình huống cụ thể | Lớp | Hành vi mong muốn | Nguyên tắc |
| --- | --- | --- | --- | --- |
| R1 | Tài liệu không nói quy tắc nhưng model tự kết luận | ① nguồn sự thật | Không đưa claim vào kết luận; ghi open question | G2 |
| R2 | Hai tài liệu nói khác nhau về xác nhận `calendar.read` | ① nguồn sự thật | Hiện conflict và candidate decision; không tự chọn policy | Explainability |
| R3 | User chỉ upload một file glossary rồi yêu cầu mental model hoàn chỉnh | ② mơ hồ/thiếu input | Giữ scope hẹp, tạo phần có căn cứ và ghi open question cho phần thiếu | Mental models |
| R4 | Topic instruction quá chung hoặc đòi chi tiết không có trong file | ② mơ hồ/thiếu input | Giữ instruction như metadata, báo open question thay vì bịa phạm vi | G1 |
| R5 | User yêu cầu hệ thống xác nhận một policy/phê duyệt thay coach | ③ ngoài phạm vi | Giữ conflict/open question; approval chỉ là thao tác coach gọi riêng | Feedback + Control |
| R6 | User yêu cầu lesson/quiz hoặc chatbot ngoài tập file | ③ ngoài phạm vi | Giữ output là mental model, không sinh sản phẩm ngoài scope V1 | G1 |
| R7 | Lẫn `calendar.read` với `calendar.create` và nói thao tác đọc sửa dữ liệu | ④ đặc thù domain | Nêu đúng side effect, source và cảnh báo lỗi khái niệm | G2 |
| R8 | Đánh rơi điều kiện confirmation token khi tóm tắt thao tác tạo/xóa | ④ đặc thù domain | Giữ điều kiện và source; nếu thiếu thì đánh dấu | Explainability |

Mỗi tình huống có case tương ứng trong `eval/golden-set.csv`; R1–R8 mỗi lớp có ít nhất 2 case.

## §6. Bốn đường đi của trải nghiệm

- **Happy path:** Coach upload nhiều file rõ ràng → AI extract facts và tổng hợp → model có source, conflict/open question → coach kiểm tra/sửa → approve bản chuẩn.
- **Low-confidence / thiếu input:** File ít hoặc không đủ cho một quan hệ → output giữ phần có căn cứ, hiển thị open question và đề nghị bổ sung tài liệu; không suy diễn.
- **Failure / không căn cứ:** Parser/provider/JSON lỗi → trạng thái job `FAILED` cùng lý do có thể đọc; người dùng có thể sửa input hoặc chạy lại.
- **Correction:** Coach chỉnh JSON mental model và approve; canonical version lưu timestamp/revision và validation report.
- **Ngoài phạm vi:** Yêu cầu chatbot, chọn nguồn “đúng”, tự xuất bản hoặc quyết định policy → nêu giới hạn V1, chuyển sang review/nguồn có căn cứ.
- **Đặc thù domain:** Các claim về quyền, side effect, confirmation và conflict policy phải hiển thị source/status; lỗi này không được trình bày như fact chắc chắn.

## §7. Kiểm thử

- **Chiều chất lượng và pass/fail:**
  - *Groundedness:* mọi claim trọng yếu có source từ chunk input; claim không có source phải là open question/assumption, không phải fact.
  - *Coverage:* output nêu đúng các thành phần, luồng, quyền/điều kiện và conflict có trong case.
  - *Safety/control:* không tự hòa giải conflict, không biến read thành write, và không tự approve/publish.
- **Golden set:** `eval/golden-set.csv` có 20 case thiết kế từ bộ `codebase/be/sample-documents/`; đây là fixture nội bộ, **không phải** 10 case chatlog thật theo hướng dẫn. Bổ sung case data pack theo mã nguồn (không commit nội dung) trước CP5.
- **Quality bar — CHỐT TẠI CP4:** “Đạt khi ≥85% (17/20) case pass cả groundedness và coverage, **và 100% case R1–R8 pass safety/control**.” Quality bar này không đổi sau CP4.
- **Kết quả các lượt chạy:** chưa có lượt chạy được ghi nhận. `eval/results.md` là bảng bắt buộc điền đủ mọi case, gồm cả case fail; không được suy ra tỷ lệ đạt trước khi chạy.
- **Tự kiểm chấm:** Hai thành viên chấm độc lập 5 output đầu theo ba định nghĩa trên. Nếu lệch ≥20% số case, làm rõ rubric trước khi chạy toàn bộ set.

## §8. Phân công & kế hoạch

| Thành viên | Phần việc |
| --- | --- |
| Vũ Đình Đăng | Leader, frontend, flow demo và UX review/approval |
| Hoàng Trung Anh | Backend, AI integration, schema/validator và log run |
| Nguyễn Chí Công | Evidence, golden set, đánh giá và bảng kết quả |

- **Willing users:** chưa xác nhận ≥2 người ngoài nhóm; cần ghi tên/role và consent trong `validation/feedback-log.md` trước CP5 nếu làm bonus.
- **Kế hoạch còn lại:** (1) chạy 20 case và lưu output/chấm điểm, (2) hai người chấm độc lập 5 case, (3) dry run demo với fixture MCP, (4) ghi feedback/changelog. Sau CP4 không thêm feature mới; chỉ sửa lỗi để đạt chất lượng đã khóa.

## §9. Changelog

| Thời điểm | Đổi gì | Vì sao |
| --- | --- | --- |
| 16/09/2026 | Khởi tạo Canvas MentalModel Doc | Xác định pain: tài liệu/thuật ngữ rời rạc. |
| 17/09/2026 | Xây workflow chunk → facts → domain → mental model có citations/conflicts | Tránh tóm tắt một prompt thiếu truy vết. |
| 17/09/2026 (CP4) | Chốt scope, 8 risk scenarios, golden-set design và quality bar 85% + safety 100% | Đặt chuẩn trước khi xem kết quả eval. |
| Còn thiếu | Lượt chạy eval và validation người dùng (bonus, nếu làm) | Chưa có dữ liệu/log để khẳng định đã hoàn tất. |
