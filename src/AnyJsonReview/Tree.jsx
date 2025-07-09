import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

// 递归渲染树节点
function TreeNode({ data, name, onPreview, level = 0 }) {
    // 所有节点默认展开
    const [expanded, setExpanded] = useState(true);
    const isObject = data && typeof data === 'object';
    const isArray = Array.isArray(data);

    // 判断是否为简单类型或短文本
    const isSimpleOrShort = !isObject && (typeof data === 'string' ? data.length <= 20 : true);

    // 识别链接的正则
    const urlRegex = /^(https?:\/\/|www\.)[\w\-]+(\.[\w\-]+)+([\w\-.,@?^=%&:/~+#]*[\w\-@?^=%&/~+#])?/i;

    const handleClick = (e) => {
        e.stopPropagation();
        if (isSimpleOrShort) return; // 简单类型或短文本不弹窗
        onPreview(name, data, e);
    };

    // 复制功能
    const handleCopy = (e) => {
        e.stopPropagation();
        if (typeof window.utools !== 'undefined' && window.utools.copyText) {
            window.utools.copyText(typeof data === 'string' ? data : JSON.stringify(data));
        } else {
            // 兼容无utools环境
            if (navigator.clipboard) {
                navigator.clipboard.writeText(typeof data === 'string' ? data : JSON.stringify(data));
            }
        }
    };

    // 仅用于树节点缩略展示
    const getSummary = (val) => {
        if (typeof val === 'string') {
            return val.length > 30 ? val.slice(0, 30) + '...' : val;
        }
        return JSON.stringify(val);
    };

    // 判断是否为链接
    const isLink = typeof data === 'string' && urlRegex.test(data);

    // 链接点击处理
    const handleLinkClick = (e) => {
        if (typeof window.utools !== 'undefined' && window.utools.shellOpenExternal) {
            e.preventDefault();
            const url = data.startsWith('http') ? data : `http://${data}`;
            window.utools.shellOpenExternal(url);
        }
        // 否则，默认行为（浏览器新标签页）
    };

    return (
        <div style={{ marginLeft: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', cursor: isSimpleOrShort ? 'default' : 'pointer' }} onClick={() => setExpanded(!expanded)}>
                {isObject ? (
                    <span style={{ marginRight: 4 }}>{expanded ? '▼' : '▶'}</span>
                ) : null}
                <span
                    onClick={handleClick}
                    style={{ color: '#58a4f6', marginRight: 4, cursor: isSimpleOrShort ? 'default' : 'pointer' }}
                >{name !== undefined ? name + ':' : ''}</span>
                {/* 只做缩略展示，不做markdown渲染 */}
                {!isObject && (
                    isLink ? (
                        <a
                            href={data.startsWith('http') ? data : `http://${data}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 300,
                                color: '#1a73e8',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                            }}
                            onClick={handleLinkClick}
                        >
                            {getSummary(data)}
                        </a>
                    ) : (
                        <span
                            onClick={handleClick}
                            style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300, color: '#666', cursor: isSimpleOrShort ? 'default' : 'pointer' }}
                        >
                            {getSummary(data)}
                        </span>
                    )
                )}
                {/* 复制按钮，所有节点都可复制 */}
                <button
                    onClick={handleCopy}
                    style={{ marginLeft: 4, fontSize: 12, cursor: 'pointer', border: 'none', background: 'transparent', color: '#aaa' }}
                    title="复制"
                >📋</button>
            </div>
            {expanded && isObject && (
                <div>
                    {isArray
                        ? data.map((item, idx) => (
                            <TreeNode key={idx} data={item} name={idx} onPreview={onPreview} level={level + 1} />
                        ))
                        : Object.entries(data).map(([k, v]) => (
                            <TreeNode key={k} data={v} name={k} onPreview={onPreview} level={level + 1} />
                        ))}
                </div>
            )}
        </div>
    );
}

// 弹窗组件
function PreviewModal({ open, onClose, name, value }) {
    const minWidth = 300;
    const minHeight = 200;
    const maxWidth = 800;
    const maxHeight = 700;
    const [size, setSize] = useState({ width: 700, height: 400 });
    const resizing = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    if (!open) return null;
    const style = {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 99999,
        background: '#fff',
        color: '#222',
        border: '1px solid #ccc',
        borderRadius: 6,
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        width: size.width,
        height: size.height,
        padding: 0,
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
    };
    const closeBtnStyle = {
        position: 'absolute',
        left: 8,
        top: 8,
        background: 'transparent',
        border: 'none',
        fontSize: 18,
        cursor: 'pointer',
        color: '#888',
        zIndex: 100000,
    };
    const contentStyle = {
        padding: '40px 24px 24px 24px',
        overflow: 'auto',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
    };
    // 拖拽手柄事件
    const handleMouseDown = (e) => {
        e.preventDefault();
        resizing.current = true;
        lastPos.current = { x: e.clientX, y: e.clientY };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };
    const handleMouseMove = (e) => {
        if (!resizing.current) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        setSize(prev => {
            let newWidth = Math.max(minWidth, Math.min(maxWidth, prev.width + dx));
            let newHeight = Math.max(minHeight, Math.min(maxHeight, prev.height + dy));
            return { width: newWidth, height: newHeight };
        });
        lastPos.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseUp = () => {
        resizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };
    const resizeHandleStyle = {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 20,
        height: 20,
        cursor: 'nwse-resize',
        zIndex: 100001,
        background: 'transparent',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        userSelect: 'none',
    };
    const resizeIconStyle = {
        width: 16,
        height: 16,
        borderRight: '2px solid #bbb',
        borderBottom: '2px solid #bbb',
        borderRadius: 2,
        margin: 2,
    };
    const modal = (
        <div style={{ ...style, position: 'fixed' }} onClick={e => e.stopPropagation()}>
            <button onClick={onClose} style={closeBtnStyle} title="关闭">✖</button>
            <div style={contentStyle}>
                <div style={{ fontWeight: 'bold', marginBottom: 8, marginTop: 8, textAlign: 'center' }}>{name}</div>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{typeof value === 'string' ? value : JSON.stringify(value, null, 2)}</pre>
            </div>
            <div style={resizeHandleStyle} onMouseDown={handleMouseDown}>
                <div style={resizeIconStyle}></div>
            </div>
        </div>
    );
    return createPortal(modal, document.body);
}

// 主树组件
export default function Tree({ data }) {
    const [preview, setPreview] = useState({ open: false, name: '', value: null });

    const handlePreview = (name, value, e) => {
        setPreview({
            open: true,
            name,
            value,
        });
    };

    const handleClose = () => setPreview({ ...preview, open: false });

    return (
        <div style={{ fontFamily: 'monospace', fontSize: 14, position: 'relative' }}>
            <TreeNode data={data} name={undefined} onPreview={handlePreview} />
            <PreviewModal {...preview} onClose={handleClose} />
        </div>
    );
}
