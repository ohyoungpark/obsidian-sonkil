# Sonkil - Emacs-style Text Operations for Obsidian

한국어로 '손길'은 정성 어린 도움이나 섬세한 터치를 뜻합니다.
이 플러그인은 노트를 존중하며, 꼭 필요한 부분에 조용히 손을 내미는 조력자가 되고자 합니다.

## 기능

### 주요 기능

- **Kill ring**: 최대 120개 항목을 저장하는 텍스트 저장소
- **클립보드 동기화**: kill/copy된 텍스트는 시스템 클립보드에 자동 동기화
- **멀티 커서 Kill Line**: 여러 커서 위치에서 텍스트를 한 번에 잘라내어 하나의 문단으로 저장
- **마크 선택 영역 시각화**: 마크와 커서 사이의 선택된 텍스트가 배경색으로 표시됨
- **멀티 커서 Yank**: 여러 커서 위치에 동시에 텍스트를 붙여넣기
- **상태 표시줄 피드백**: 현재 작업 상태를 상태 표시줄에 표시

### 사용 가능한 명령어 및 추천 단축키

**중요:** Obsidian 플러그인 가이드라인에 따라, 사용자의 기존 설정과의 충돌 가능성을 피하고 운영체제 간 호환성을 보장하기 위해 기본 단축키를 제거했습니다. Obsidian 설정(설정 > 단축키)에서 Sonkil 명령어에 대한 단축키를 직접 설정할 수 있습니다.

기존 기본값을 바탕으로 제안되는 키 조합은 다음과 같습니다:

| 제안 단축키          | 명령어 이름 (Command Name)             | 설명                                                                                               |
| ---------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `Ctrl+Shift+ArrowDown` | `Sonkil: Add cursor down`              | 아랫줄에 커서 추가                                                                               |
| `Ctrl+Shift+ArrowUp`   | `Sonkil: Add cursor up`                | 윗줄에 커서 추가                                                                                 |
| `Ctrl+g`               | `Sonkil: Cancel mark and exit yank mode` | 현재 작업 취소 (마크, Yank 모드, 멀티 커서)                                                        |
| `Alt+w`                | `Sonkil: Copy region`                  | 마크와 현재 커서 사이의 텍스트를 복사하기 (Copy Region)                                            |
| `Ctrl+k`               | `Sonkil: Kill line`                    | 현재 커서 위치부터 줄 끝까지 텍스트를 잘라내기 (Kill Line)                                         |
| `Ctrl+w`               | `Sonkil: Kill region`                  | 마크와 현재 커서 사이의 텍스트를 잘라내기 (Kill Region)                                            |
| `Ctrl+l`               | `Sonkil: Recenter editor view`         | 에디터 뷰 리센터링 (중앙/상단/하단 순환)                                                           |
| `Ctrl+Space`           | `Sonkil: Set mark`                     | 현재 커서 위치에 마크 설정 (Set Mark)                                                              |
| `Ctrl+y`               | `Sonkil: Yank`                         | Kill ring에서 가장 최근 텍스트 붙여넣기 (Yank, Kill ring이 비어 있으면 시스템 클립보드에서 가져옴) |
| `Alt+y`                | `Sonkil: Yank pop`                     | Yank 직후에 사용하면 이전에 잘라낸 텍스트로 순환 (Yank Pop)                                        |

## 설치 방법

### 일반 사용자

**방법 1: 커뮤니티 플러그인 (권장)**

1. Obsidian 설정에서 "커뮤니티 플러그인" 활성화
2. "안전 모드" 비활성화
3. "Sonkil" 플러그인 검색 및 설치, 활성화

**방법 2: 수동 설치**

또는, 다음과 같이 수동으로 설치할 수 있습니다:

1.  이 저장소의 [GitHub Releases 페이지](https://github.com/ohyoungpark/obsidian-sonkil/releases)로 이동합니다.
2.  설치하려는 버전의 `main.js`, `manifest.json`, `styles.css`(있는 경우) 파일을 다운로드합니다.
3.  Obsidian Vault의 플러그인 폴더 (`Vault폴더/.obsidian/plugins/`) 안에 `obsidian-sonkil`이라는 새 폴더를 만듭니다. (Vault 폴더 경로는 Obsidian 설정의 '정보' 탭에서 확인할 수 있습니다.)
4.  다운로드한 파일들을 새로 만든 `obsidian-sonkil` 폴더 안에 복사합니다.
5.  Obsidian을 완전히 종료했다가 다시 시작합니다.
6.  Obsidian 설정 > 커뮤니티 플러그인으로 이동하여 **안전 모드가 비활성화되어 있는지 확인**하고 "Sonkil" 플러그인을 활성화합니다.

### 단축키 설정하기

Obsidian 플러그인 가이드라인에 따라 기본 단축키가 제공되지 않으므로, 직접 설정해야 합니다:

1.  **설정**(왼쪽 하단의 톱니바퀴 아이콘)으로 이동합니다.
2.  왼쪽 사이드바에서 **단축키** 섹션으로 이동합니다.
3.  단축키 섹션 상단의 검색창에 `Sonkil:`을 입력하여 이 플러그인이 제공하는 명령어들을 필터링합니다.
4.  설정하려는 명령어를 찾습니다 (예: `Sonkil: Set mark`).
5.  명령어 이름 옆의 `+` 아이콘을 클릭합니다.
6.  할당하려는 키 조합을 누릅니다 (예: `Ctrl+Space`). 위의 표에서 제안된 조합을 사용하거나 원하는 다른 조합을 사용할 수 있습니다.
7.  단축키로 사용하려는 모든 Sonkil 명령어에 대해 4-6단계를 반복합니다.

### 개발자용

#### 요구사항

- Node.js 18 이상
- npm 10 이상
- Obsidian 데스크톱 앱

#### 개발 환경 설정

1. 프로젝트 클론:

```bash
git clone https://github.com/ohyoungpark/obsidian-sonkil
cd obsidian-sonkil
```

2. Node.js 버전 설정 (nvm 사용):

```bash
nvm use
```

3. 의존성 설치:

```bash
npm install
```

4. 개발 환경 설정:

```bash
# .env 파일 생성
echo "OBSIDIAN_PLUGIN_DIR=/path/to/your/obsidian/plugins/obsidian-sonkil" > .env

# .env 파일의 OBSIDIAN_PLUGIN_DIR 값을 자신의 Obsidian 플러그인 디렉토리 경로로 수정
```

5. 빌드 및 테스트:

```bash
# 빌드
npm run build

# 테스트 실행
npm test

# 개발 모드 설치 (로컬 Obsidian vault에 설치)
npm run install-dev
```

> **참고**:
>
> - `.env` 파일은 Git에 커밋되지 않도록 `.gitignore`에 추가되어 있습니다.
> - 개발 모드 설치 후에는 Obsidian을 재시작해야 변경사항이 적용됩니다.

## 라이선스

이 프로젝트는 The Unlicense를 사용하여 퍼블릭 도메인으로 공개됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## Translations

- [English](README.md)
