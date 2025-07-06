import Tree from './Tree';
// 递归处理对象或数组中的JSON字符串字段
function parseJsonStrings(obj) {
    if (typeof obj === 'string') {
        // 尝试解析字符串为JSON
        try {
            const parsed = JSON.parse(obj);
            return parseJsonStrings(parsed);
        } catch (e) {
            // 如果不是有效的JSON字符串，返回原字符串
            return obj;
        }
    } else if (Array.isArray(obj)) {
        // 处理数组
        return obj.map(item => parseJsonStrings(item));
    } else if (obj !== null && typeof obj === 'object') {
        // 处理对象
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = parseJsonStrings(value);
        }
        return result;
    } else {
        // 返回原始值（数字、布尔值、null等）
        return obj;
    }
}
export default function AnyJsonReview({ enterAction }) {
    const payload = enterAction.payload
    let path = ''
    if (Array.isArray(payload)) {
        path = payload[0].path
    } else  {
        path = payload
    } 
    
    //如果本身就是一个json
    let parsed = ""
    if(
        (path.startsWith('{') || path.startsWith('['))
        &&
        (path.endsWith('}') || path.endsWith(']'))
    ) {
        parsed = parseJsonStrings(path)
    } else {
        const content = window.services.readFile(path)
        parsed = parseJsonStrings(content)
    }
    return (
        <div className='any-json-parse'>
            <Tree data={parsed} />
        </div>
    )
}