# Yêu cầu sư phạm cho Lesson Blueprint

## 1. Vai trò của blueprint

Lesson blueprint là bản thiết kế con đường học tập được tạo từ mental model đã được duyệt.
Nó mô tả người học sẽ đi từ trạng thái hiểu biết nào đến trạng thái có thể làm được gì.

Blueprint **không phải**:

- bài viết lesson hoàn chỉnh;
- danh sách tiêu đề được xếp theo cảm tính;
- bản sao của mental model;
- danh sách toàn bộ hoạt động có thể làm;
- kịch bản UI chi tiết.

Blueprint là hợp đồng trung gian giữa AI tạo kiến thức và AI viết lesson. Người duyệt phải có thể nhìn vào blueprint và trả lời được:

1. Người học cần đạt được năng lực nào?
2. Vì sao block này đứng trước block kia?
3. Mỗi block đang giúp xây phần nào của mental model?
4. Người học sẽ làm gì để biến thông tin thành hiểu biết hoặc kỹ năng?
5. Bằng chứng nào cho thấy người học đã sẵn sàng đi tiếp?

## 2. Phân biệt ba artifact

| Artifact | Câu hỏi chính | Nội dung chính |
|---|---|---|
| Mental model | Hệ thống hoặc chủ đề thực sự vận hành thế nào? | Entity, quan hệ, causal mechanism, workflow, state, rule, boundary |
| Learning blueprint | Dạy mental model đó theo con đường nào? | Mục tiêu, prerequisite, thứ tự block, hoạt động, checkpoint, transition |
| Lesson | Trình bày và triển khai việc học ra sao? | Văn bản, hình ảnh, mô phỏng, câu hỏi, feedback, UI cụ thể |

Blueprint có thể thêm thông tin sư phạm mà mental model không có, nhưng không được thêm fact về domain nếu fact đó không có trong mental model hoặc source được dẫn lại.

## 3. Đầu vào tối thiểu

Blueprint chỉ nên được tạo khi có đủ các đầu vào sau:

- mental model đã được duyệt hoặc được đánh dấu là đủ tin cậy để thiết kế bài học;
- danh sách core entities, relationships, workflows, rules và boundaries;
- các dependency giữa khái niệm;
- contradictions, assumptions và open questions;
- đối tượng người học;
- mục tiêu học tập hoặc năng lực cần đạt;
- thời lượng hoặc giới hạn quy mô lesson, nếu có;
- các ràng buộc về format, ví dụ cần có simulation hoặc không được dùng video.

Nếu thiếu audience, learning goal hoặc prerequisite, blueprint phải đánh dấu là `needs_input`, không tự bịa giá trị mặc định rồi coi như đã hoàn chỉnh.

## 4. Kết quả mong muốn

Blueprint nên có cấu trúc tối thiểu sau:

```json
{
  "title": "...",
  "audience": "...",
  "learning_goal": "...",
  "prerequisites": [],
  "success_criteria": [],
  "estimated_duration": "...",
  "sequence_rationale": "...",
  "blocks": [],
  "coverage_map": {},
  "misconceptions": [],
  "assessment_plan": {},
  "open_design_questions": [],
  "warnings": []
}
```

Mỗi block nên có tối thiểu:

```json
{
  "id": "block_01",
  "order": 1,
  "title": "...",
  "purpose": "...",
  "learning_objective": "...",
  "prerequisite_blocks": [],
  "covers": {
    "entities": [],
    "relationships": [],
    "workflows": [],
    "rules": [],
    "boundaries": []
  },
  "representation": "text|diagram|example|simulation|practice|reflection",
  "learner_action": "...",
  "evidence_of_learning": "...",
  "checkpoint": null,
  "transition_to_next": "...",
  "estimated_duration": "..."
}
```

## 5. Yêu cầu bắt buộc đối với learning sequence

### 5.1. Bắt đầu từ năng lực đích

Sequence phải bắt đầu từ việc xác định người học sẽ làm được gì sau bài học. Mục tiêu cần quan sát hoặc kiểm tra được, không nên chỉ dùng các động từ mơ hồ như:

- hiểu;
- biết;
- nắm được;
- làm quen với.

Có thể viết mục tiêu bằng cấu trúc:

> Người học có thể **[hành động quan sát được]** **[đối tượng]** trong **[điều kiện hoặc ngữ cảnh]**, đạt **[tiêu chí]**.

Ví dụ tốt:

> Người học có thể phân loại trách nhiệm của client và server trong một MCP request, đồng thời chỉ ra điểm cần kiểm tra quyền và điểm cần user confirmation.

Mỗi block phải đóng góp cho ít nhất một mục tiêu. Block không đóng góp cho mục tiêu nào phải bị loại bỏ hoặc ghi rõ lý do giữ lại.

### 5.2. Xác định prerequisite thật sự cần thiết

Prerequisite là kiến thức hoặc kỹ năng người học phải có trước khi block bắt đầu, không phải danh sách mọi thứ có liên quan.

Một prerequisite hợp lệ phải thỏa cả ba điều kiện:

1. Block hiện tại thực sự sử dụng nó.
2. Nếu thiếu nó, người học khó hoàn thành learner action.
3. Nó chưa được dạy đầy đủ ở một block trước đó.

Nếu prerequisite quan trọng nhưng người học chưa chắc có, sequence phải chọn một trong hai cách:

- thêm một activation block ngắn để khởi động lại kiến thức đó;
- giảm độ khó của block hiện tại và cung cấp scaffold.

Không nên biến mọi kiến thức nền thành một bài giảng riêng nếu chỉ cần nhắc lại ngắn.

### 5.3. Sắp xếp theo dependency, không theo thứ tự xuất hiện trong tài liệu

Thứ tự trong nguồn tài liệu không mặc nhiên là thứ tự dạy học tốt. Sequence phải dựa trên dependency giữa các khái niệm.

Một quan hệ `A → B` nên được hiểu là người học cần có A ở mức đủ dùng trước khi phải dùng B. Dependency có thể là:

- **khái niệm**: biết entity trước khi học relationship;
- **nhân quả**: biết điều kiện trước khi học kết quả;
- **quy trình**: biết bước kiểm tra trước khi học bước thực thi;
- **trạng thái**: biết state hiện tại trước khi học transition;
- **kỹ năng**: luyện thao tác đơn giản trước khi xử lý case tổng hợp.

Sequence không được có block sử dụng khái niệm chưa được giới thiệu mà không có giải thích hoặc scaffold tại chỗ.

### 5.4. Đi từ khung tổng thể đến chi tiết, nhưng không biến thành overview dài

Người học cần một khung định hướng sớm để biết mình đang học hệ thống nào và vì sao các phần liên quan với nhau. Tuy nhiên, overview đầu bài chỉ nên cung cấp:

- vấn đề hoặc nhiệm vụ trung tâm;
- cấu trúc lớn của chủ đề;
- đích đến của bài học.

Không đưa toàn bộ định nghĩa, ngoại lệ và chi tiết kỹ thuật vào block đầu tiên. Chi tiết nên xuất hiện khi người học đã có đủ context để gắn nó vào mental model.

### 5.5. Quản lý tải nhận thức

Mỗi block phải có một trọng tâm nhận thức chính. Không gom quá nhiều loại khó vào cùng một block, ví dụ vừa giới thiệu 8 entity, vừa dạy workflow, vừa yêu cầu debug một case mới.

Blueprint cần kiểm tra:

- số lượng khái niệm mới trong mỗi block;
- số quan hệ mới mà người học phải giữ trong working memory;
- số điều kiện hoặc ngoại lệ được giới thiệu cùng lúc;
- số thao tác phải thực hiện trong một nhiệm vụ;
- mức độ quen thuộc của bối cảnh.

Khi độ phức tạp cao, sequence nên:

- chia nhỏ thành các phần có ý nghĩa;
- dùng diagram hoặc worked example để giảm tải;
- làm rõ một biến tại một thời điểm;
- cho người học luyện một phần trước khi ghép toàn bộ;
- trì hoãn ngoại lệ ít quan trọng đến sau khi quy tắc chính đã ổn định.

Không chia nhỏ một khái niệm thành các mảnh vụn không còn ý nghĩa chỉ để tạo nhiều block.

### 5.6. Kích hoạt kiến thức cũ và tạo cầu nối

Nếu lesson dựa vào kiến thức nền, sequence nên có một điểm activation ngắn:

- câu hỏi dự đoán;
- yêu cầu giải thích bằng ngôn ngữ của người học;
- ví dụ quen thuộc để liên hệ;
- nhiệm vụ phân loại đơn giản.

Activation không phải bài kiểm tra loại người học. Mục đích là làm lộ kiến thức đang có và tạo cầu nối sang khái niệm mới.

### 5.7. Mỗi block phải có learner action

Người học không chỉ nhận thông tin. Mỗi block, ngoại trừ một số block định hướng rất ngắn, phải yêu cầu một hành động phù hợp với mục tiêu, chẳng hạn:

- dự đoán kết quả;
- xác định thành phần;
- nối quan hệ;
- sắp xếp workflow;
- giải thích vì sao;
- áp dụng rule vào case;
- phát hiện lỗi;
- sửa một cấu hình;
- so sánh hai phương án;
- tạo một artefact nhỏ.

`learner_action` phải nói rõ người học làm gì, không chỉ nói “đọc nội dung” hoặc “xem ví dụ”.

### 5.8. Chuyển dần trách nhiệm từ hệ thống sang người học

Sequence tốt thường có mức hỗ trợ giảm dần:

```text
Giải thích / minh họa
  → Worked example
  → Guided practice
  → Independent practice
  → Transfer task
```

Không nên yêu cầu người học giải quyết case mới ngay sau định nghĩa. Ngược lại, cũng không nên giữ họ ở mức xem ví dụ quá lâu mà không được tự làm.

Mỗi block nên ghi rõ mức hỗ trợ:

```text
full_support | guided | partial_support | independent
```

### 5.9. Dùng ví dụ và phản ví dụ có mục đích

Ví dụ phải làm rõ một khái niệm, quan hệ hoặc rule cụ thể. Blueprint cần ghi được:

- ví dụ đang minh họa phần nào của mental model;
- điểm nào người học cần chú ý;
- ví dụ này có điều gì không được khái quát quá mức.

Phản ví dụ nên được dùng khi dễ hình thành misconception, đặc biệt với:

- hai khái niệm gần giống nhau;
- rule có boundary;
- trường hợp ngoại lệ;
- hành động đúng trong một context nhưng sai trong context khác.

Không thêm ví dụ chỉ để làm lesson dài hơn.

### 5.10. Dạy rule cùng với boundary

Một rule không đầy đủ nếu người học không biết nó áp dụng khi nào và không áp dụng khi nào. Nếu mental model có boundary hoặc contradiction, sequence phải quyết định nơi chúng được đưa vào:

- giới thiệu sớm nếu thiếu boundary sẽ gây hiểu sai ngay;
- trì hoãn nếu boundary là chi tiết nâng cao;
- đưa vào checkpoint nếu mục tiêu là phân biệt hai trường hợp.

Không được biến assumption hoặc open question thành fact đã xác nhận trong blueprint.

### 5.11. Có checkpoint theo từng chặng, không chỉ một bài kiểm tra cuối

Checkpoint nên xuất hiện sau các khái niệm hoặc thao tác quan trọng. Mỗi checkpoint cần có:

- năng lực được kiểm tra;
- prompt hoặc nhiệm vụ;
- đáp án hoặc tiêu chí đánh giá;
- feedback khi đúng;
- feedback khi sai;
- điều kiện để đi tiếp hoặc cần quay lại.

Checkpoint phải kiểm tra việc sử dụng mental model, không chỉ kiểm tra nhớ định nghĩa.

Ví dụ yếu:

> MCP là viết tắt của gì?

Ví dụ tốt hơn:

> Trong request tạo event, thành phần nào phải kiểm tra quyền và tại thời điểm nào cần xác nhận lại với người dùng?

### 5.12. Tạo transition rõ giữa các block

Mỗi transition phải giải thích được vì sao block sau xuất hiện. Có thể dùng một trong các quan hệ:

- block sau sử dụng kiến thức vừa học;
- block sau mở rộng cùng cơ chế sang context mới;
- block sau xử lý ngoại lệ của block trước;
- block sau yêu cầu tích hợp nhiều phần đã học;
- checkpoint cho thấy đã sẵn sàng chuyển tiếp.

Nếu không thể mô tả transition bằng một câu rõ ràng, thứ tự có thể chưa hợp lý.

### 5.13. Kết thúc bằng tích hợp và transfer

Lesson không nên kết thúc ngay sau khi người học biết từng phần riêng lẻ. Cần có một nhiệm vụ tích hợp để người học:

- dùng nhiều thành phần của mental model cùng lúc;
- xử lý một case chưa lặp lại y nguyên ví dụ;
- giải thích lựa chọn của mình;
- nhận ra boundary hoặc trade-off.

Transfer task phải phù hợp với learning goal và không được đòi hỏi kiến thức ngoài scope mà blueprint không khai báo.

## 6. Yêu cầu cho từng learning block

Một block chỉ được coi là đủ đặc tả khi có các trường sau:

### Purpose

Block tồn tại để thay đổi điều gì trong hiểu biết hoặc năng lực của người học?

### Learning objective

Người học làm được gì sau block này? Dùng động từ quan sát được.

### Mental-model coverage

Block này dạy entity, relationship, workflow, rule hoặc boundary nào? Phải có mapping cụ thể, không chỉ ghi “liên quan đến MCP”.

### Representation

Chọn hình thức phù hợp với bản chất nội dung:

- `text`: định nghĩa hoặc giải thích ngắn;
- `diagram`: cấu trúc, quan hệ, ownership;
- `sequence`: trình tự hoặc request flow;
- `example`: áp dụng rule trong case;
- `simulation`: hệ thống thay đổi theo hành động;
- `practice`: người học tự làm;
- `reflection`: giải thích hoặc so sánh bằng ngôn ngữ của mình.

Không chọn representation theo sở thích giao diện. Chọn theo loại nhận thức cần hình thành.

### Learner action

Người học phải làm gì? Hành động cần có đầu ra có thể quan sát hoặc đánh giá.

### Scaffold

Block cung cấp hỗ trợ gì: hint, template, partial answer, worked example, visual cue hay không có hỗ trợ?

### Evidence of learning

Sản phẩm hoặc biểu hiện nào cho thấy người học đã đạt mục tiêu block?

### Checkpoint

Nếu block có rủi ro hiểu sai hoặc là prerequisite cho nhiều block sau, phải có checkpoint.

### Transition

Vì sao block kế tiếp phụ thuộc vào block này?

## 7. Coverage và traceability

Blueprint phải có coverage map từ mental model sang sequence:

```json
{
  "core_idea": ["block_01"],
  "actors": ["block_02"],
  "main_workflows": ["block_03", "block_04"],
  "business_rules": ["block_04", "block_05"],
  "boundaries": ["block_05"],
  "open_questions": []
}
```

Validator cần phát hiện:

- core concept không được block nào cover;
- block cover một concept không tồn tại trong mental model;
- concept quan trọng chỉ xuất hiện trong một checkpoint nhưng chưa được dạy;
- coverage bị lặp lại nhiều lần mà không có mục đích tăng độ sâu;
- workflow được dạy nhưng thiếu prerequisite entity hoặc rule;
- blueprint tự thêm claim không có nguồn.

Coverage không có nghĩa là mọi câu trong mental model phải trở thành một block. Chi tiết có thể được gom vào một block nếu vẫn giữ được mục tiêu và tải nhận thức phù hợp.

## 8. Misconception và error design

Blueprint nên dự đoán các hiểu nhầm có khả năng xảy ra từ mental model, chẳng hạn:

```json
{
  "misconception": "Client tự chịu trách nhiệm bảo vệ quyền truy cập.",
  "caused_by": ["ownership_and_dependencies"],
  "addressed_in": ["block_02", "block_04"],
  "diagnostic_prompt": "Ai phải từ chối request khi scope không hợp lệ?",
  "feedback_principle": "Nhắc lại rằng kiểm soát quyền phải được thực thi ở server."
}
```

Không đưa misconception vào bài chỉ vì nó có trong một danh sách mẫu. Chỉ giữ những misconception có căn cứ từ:

- contradiction hoặc ambiguity trong source;
- kinh nghiệm domain đã được cung cấp;
- lỗi dễ suy ra từ cách trình bày;
- kết quả đánh giá người học trước đó.

## 9. Quy tắc về thời lượng và độ dài

Thời lượng là ràng buộc thiết kế, không phải mục tiêu tự thân.

Blueprint phải ước lượng:

- thời gian giới thiệu;
- thời gian quan sát ví dụ hoặc diagram;
- thời gian người học tự làm;
- thời gian feedback;
- thời gian tổng hợp cuối bài.

Nếu vượt thời lượng, ưu tiên giữ:

1. cơ chế trung tâm;
2. prerequisite cần thiết;
3. practice và feedback;
4. boundary quan trọng;
5. transfer task.

Các chi tiết ít ảnh hưởng đến mục tiêu có thể chuyển thành optional hoặc reading thêm. Không cắt practice trước chỉ để giữ toàn bộ phần giải thích.

## 10. Các lỗi sequence cần từ chối

Blueprint nên bị đánh dấu `invalid` hoặc `needs_revision` nếu có một trong các lỗi sau:

- bắt đầu bằng quá nhiều định nghĩa mà không có mục tiêu hoặc context;
- yêu cầu kiến thức chưa từng được giới thiệu;
- có block không có learner action trong khi mục tiêu yêu cầu kỹ năng;
- mọi block đều là `text` dù nội dung là workflow, state hoặc relationship;
- checkpoint chỉ kiểm tra nhớ lại, không kiểm tra áp dụng;
- không có feedback hoặc tiêu chí đúng/sai;
- đưa transfer task trước guided practice;
- dạy ngoại lệ trước khi người học hiểu rule chính mà không có lý do;
- lặp lại cùng một nội dung mà không tăng độ sâu hoặc thay đổi context;
- có claim mới không truy được về mental model hoặc source;
- bỏ qua contradiction, boundary hoặc open question quan trọng;
- sequence không có điểm kết thúc và success criteria;
- block title nghe hợp lý nhưng purpose và learner action không khác nhau;
- quá nhiều block nhỏ đến mức người học không thấy ý nghĩa của mỗi block.

## 11. Tiêu chí duyệt blueprint của lab coach

Lab coach có thể dùng checklist sau:

### Tính đúng

- [ ] Không có kiến thức domain mới bị AI tự thêm.
- [ ] Mọi claim quan trọng truy được về mental model hoặc source.
- [ ] Contradiction, assumption và boundary không bị biến mất.

### Tính sư phạm

- [ ] Learning goal dùng động từ quan sát được.
- [ ] Prerequisite là cần thiết và không dư thừa.
- [ ] Thứ tự phản ánh dependency giữa các khái niệm.
- [ ] Tải nhận thức của từng block có thể chấp nhận.
- [ ] Có activation, scaffold và giảm hỗ trợ dần khi phù hợp.
- [ ] Có learner action thực sự.
- [ ] Có checkpoint tại các điểm rủi ro hoặc dependency quan trọng.
- [ ] Có feedback và điều kiện để đi tiếp.
- [ ] Có nhiệm vụ tích hợp hoặc transfer phù hợp với mục tiêu.

### Tính triển khai

- [ ] Mỗi block có representation phù hợp.
- [ ] Có mapping từ block về mental model.
- [ ] Có thể sinh lesson từ blueprint mà không phải đoán thứ tự.
- [ ] Thời lượng tổng thể phù hợp với scope.
- [ ] Các câu hỏi còn thiếu được ghi trong `open_design_questions`.

## 12. Ví dụ sequence rút gọn cho chủ đề MCP

Một sequence hợp lý có thể là:

```text
1. Vấn đề và mục tiêu của MCP
   Người học nhận ra vì sao AI cần một giao diện năng lực có kiểm soát.

2. Các vai trò và ranh giới
   Người học phân biệt user, AI client, MCP server và hệ thống phía sau.

3. Khám phá capability và schema
   Người học hiểu client biết tool nào được công bố và tham số nào hợp lệ.

4. Request flow đọc dữ liệu
   Người học sắp xếp và giải thích các bước từ mục tiêu đến kết quả.

5. Quyền, side effect và confirmation
   Người học phân biệt đọc dữ liệu với hành động thay đổi dữ liệu.

6. Audit, error và thay đổi registry
   Người học xử lý các tình huống cần truy vết hoặc không còn tool hợp lệ.

7. Case tổng hợp: thiết kế MCP server đặt phòng
   Người học tự chọn tool, quyền, điểm confirmation và trường audit log.

8. Checkpoint cuối
   Người học giải thích quyết định bằng mental model, không chỉ chọn đáp án.
```

Thứ tự này không bắt buộc cho mọi lesson. Nó chỉ hợp lệ khi dependency, audience, thời lượng và learning goal của lesson tương ứng. Blueprint phải giải thích được vì sao một sequence cụ thể được chọn.

## 13. Nguyên tắc cốt lõi

> Mental model quyết định **điều gì cần được hiểu**. Blueprint quyết định **người học sẽ hiểu nó theo con đường nào**. Lesson quyết định **cách con đường đó được triển khai thành trải nghiệm cụ thể**.

Một blueprint tốt không cố chứa tất cả nội dung. Nó làm rõ các quyết định sư phạm quan trọng đủ để một bước sau có thể tạo ra lesson nhất quán, có thể kiểm tra và không phải tự đoán ý đồ của người thiết kế.
