'use client'

import TopBar from '@/components/TopBar'
import { useState, useRef, useCallback } from 'react'

type UploadStatus = 'idle' | 'parsing' | 'uploading' | 'done' | 'error'
type TableTarget = 'employees' | 'customers'

const TABLE_INFO = {
  employees: {
    label: 'الموظفون',
    icon: '👥',
    color: '#6366F1',
    requiredCols: ['employee_id', 'employee_name', 'department', 'email', 'hire_date', 'region'],
    colMap: {
      'EmployeeID': 'employee_id', 'employee_id': 'employee_id',
      'EmployeeName': 'employee_name', 'employee_name': 'employee_name',
      'Department': 'department', 'department': 'department',
      'Email': 'email', 'email': 'email',
      'HireDate': 'hire_date', 'hire_date': 'hire_date',
      'Region': 'region', 'region': 'region',
    },
  },
  customers: {
    label: 'العملاء',
    icon: '🏢',
    color: '#8B5CF6',
    requiredCols: ['customer_id', 'customer_name', 'region', 'assigned_employee_id', 'registration_date'],
    colMap: {
      'CustomerID': 'customer_id', 'customer_id': 'customer_id',
      'CustomerName': 'customer_name', 'customer_name': 'customer_name',
      'Region': 'region', 'region': 'region',
      'AssignedEmployeeID': 'assigned_employee_id', 'assigned_employee_id': 'assigned_employee_id',
      'RegistrationDate': 'registration_date', 'registration_date': 'registration_date',
    },
  },
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = vals[i] ?? '' })
    return row
  })
}

function mapRow(row: Record<string, string>, colMap: Record<string, string>): Record<string, string> {
  const mapped: Record<string, string> = {}
  for (const [src, dst] of Object.entries(colMap)) {
    if (row[src] !== undefined) mapped[dst] = row[src]
  }
  return mapped
}

type ClearStatus = 'idle' | 'confirming' | 'clearing' | 'done' | 'error'

export default function UploadPage() {
  const [target, setTarget]       = useState<TableTarget>('employees')
  const [status, setStatus]       = useState<UploadStatus>('idle')
  const [drag, setDrag]           = useState(false)
  const [preview, setPreview]     = useState<Record<string, string>[]>([])
  const [fileName, setFileName]   = useState('')
  const [progress, setProgress]   = useState(0)
  const [message, setMessage]     = useState('')
  const [inserted, setInserted]   = useState(0)
  const [clearStatus, setClearStatus] = useState<ClearStatus>('idle')
  const [clearMsg, setClearMsg]   = useState('')
  const [clearTarget, setClearTarget] = useState<'all' | 'employees' | 'customers'>('all')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleClear() {
    setClearStatus('clearing')
    setClearMsg('')
    const res = await fetch('/api/clear', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: clearTarget }),
    })
    const json = await res.json()
    if (!res.ok) {
      setClearStatus('error')
      setClearMsg(json.error ?? 'فشل الحذف')
    } else {
      setClearStatus('done')
      setClearMsg(json.message)
    }
  }

  const info = TABLE_INFO[target]

  const processFile = useCallback(async (file: File) => {
    setStatus('parsing')
    setMessage('')
    setPreview([])
    setFileName(file.name)

    let rows: Record<string, string>[] = []

    if (file.name.endsWith('.csv')) {
      const text = await file.text()
      rows = parseCSV(text)
    } else if (file.name.match(/\.xlsx?$/)) {
      // Dynamic import to avoid SSR issues
      const XLSX = await import('xlsx')
      const buf  = await file.arrayBuffer()
      const wb   = XLSX.read(buf, { type: 'array', cellDates: true })
      const ws   = wb.Sheets[wb.SheetNames[0]]
      rows = XLSX.utils.sheet_to_json(ws, { raw: false, dateNF: 'yyyy-mm-dd' }) as Record<string, string>[]
    } else {
      setStatus('error')
      setMessage('صيغة الملف غير مدعومة. يُرجى رفع ملف CSV أو Excel.')
      return
    }

    if (rows.length === 0) {
      setStatus('error')
      setMessage('الملف فارغ أو لا يحتوي على بيانات.')
      return
    }

    const mapped = rows.map(r => mapRow(r, info.colMap))
    setPreview(mapped.slice(0, 5))
    setStatus('idle')
    // Store all mapped rows for upload
    ;(window as unknown as Record<string, unknown>).__uploadRows = mapped
  }, [info.colMap])

  async function handleUpload() {
    const rows = (window as unknown as Record<string, unknown>).__uploadRows as Record<string, string>[] | undefined
    if (!rows?.length) return

    setStatus('uploading')
    setProgress(0)
    setMessage('')

    const BATCH = 20
    let done = 0

    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: target, rows: chunk }),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(json.error ?? 'حدث خطأ أثناء الرفع')
        return
      }
      done += chunk.length
      setProgress(Math.round((done / rows.length) * 100))
    }

    setInserted(done)
    setStatus('done')
    setMessage(`تم إدراج ${done} سجل بنجاح في جدول ${info.label}`)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function reset() {
    setStatus('idle'); setPreview([]); setFileName('')
    setProgress(0); setMessage(''); setInserted(0)
    ;(window as unknown as Record<string, unknown>).__uploadRows = undefined
  }

  return (
    <>
      <TopBar title="رفع البيانات" />
      <div className="page-body">
        <div className="page-title">📤 رفع البيانات</div>
        <div className="page-subtitle">ارفع ملفات CSV أو Excel وأدرجها مباشرة في قاعدة البيانات</div>

        {/* Table selector */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          {(Object.entries(TABLE_INFO) as [TableTarget, typeof TABLE_INFO[TableTarget]][]).map(([key, val]) => (
            <button key={key} onClick={() => { setTarget(key); reset() }} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 22px', borderRadius: 12, border: '2px solid',
              borderColor: target === key ? val.color : '#E2E8F0',
              background: target === key ? `${val.color}12` : '#fff',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
              boxShadow: target === key ? `0 4px 16px ${val.color}30` : 'none',
            }}>
              <span style={{ fontSize: 22 }}>{val.icon}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: target === key ? val.color : '#0F172A' }}>{val.label}</div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>{val.requiredCols.length} أعمدة مطلوبة</div>
              </div>
              {target === key && <span style={{ marginRight: 'auto', fontSize: 16 }}>✓</span>}
            </button>
          ))}
        </div>

        {/* Required columns info */}
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <div>
            <strong>الأعمدة المطلوبة لجدول {info.label}:</strong>
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {info.requiredCols.map(c => (
                <span key={c} style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(99,102,241,.12)', color: '#3730A3', fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>{c}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Upload zone */}
        {status !== 'done' && (
          <div
            className={`upload-zone${drag ? ' drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
            <div className="upload-icon">
              {status === 'parsing' ? <div className="spinner spinner-dark" style={{ width: 28, height: 28, borderWidth: 3 }} /> : '📂'}
            </div>
            {fileName ? (
              <>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>📄 {fileName}</div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>انقر لاختيار ملف آخر</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>اسحب وأفلت الملف هنا</div>
                <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>أو انقر لاختيار الملف</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {['CSV', 'XLSX', 'XLS'].map(f => (
                    <span key={f} style={{ padding: '3px 10px', borderRadius: 99, background: '#F1F5F9', color: '#475569', fontSize: 11, fontWeight: 700, border: '1px solid #E2E8F0' }}>.{f}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Status messages */}
        {message && (
          <div className={`alert ${status === 'done' ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 16 }}>
            <span>{status === 'done' ? '✅' : '❌'}</span>
            <span>{message}</span>
          </div>
        )}

        {/* Upload progress */}
        {status === 'uploading' && (
          <div style={{ marginTop: 20, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>جارٍ الرفع…</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#6366F1' }}>{progress}٪</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Done state */}
        {status === 'done' && (
          <div style={{ marginTop: 20, background: '#fff', border: '2px solid #6EE7B7', borderRadius: 16, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#065F46', marginBottom: 6 }}>تم الرفع بنجاح!</div>
            <div style={{ fontSize: 14, color: '#047857', marginBottom: 24 }}>تم إدراج <strong>{toAr(inserted)}</strong> سجل في جدول {info.label}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={reset}>⬆ رفع ملف آخر</button>
              <a href="/" className="btn btn-secondary">📊 عرض اللوحة</a>
            </div>
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && status !== 'uploading' && status !== 'done' && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>معاينة البيانات</div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>أول 5 سجلات من الملف</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost btn-sm" onClick={reset}>✕ إلغاء</button>
                <button className="btn btn-primary" onClick={handleUpload}>
                  ⬆ رفع البيانات إلى Supabase
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {Object.keys(preview[0]).map(k => <th key={k}>{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((v, j) => (
                        <td key={j} style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DANGER ZONE: Clear Data ── */}
        <div style={{
          marginTop: 40, border: '2px solid #FCA5A5', borderRadius: 16,
          overflow: 'hidden',
        }}>
          <div style={{ background: '#FFF1F2', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>🗑️</span>
            <div>
              <div style={{ fontWeight: 800, color: '#991B1B', fontSize: 15 }}>منطقة الخطر — حذف البيانات</div>
              <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>
                هذا الإجراء لا يمكن التراجع عنه — سيتم حذف البيانات نهائياً من قاعدة البيانات
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 24px', background: '#fff' }}>
            {/* Target selector */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              {([
                ['all',       '🗑️ حذف كل شيء',   '#991B1B', '#FEE2E2'],
                ['customers', '🏢 حذف العملاء فقط', '#92400E', '#FEF3C7'],
                ['employees', '👥 حذف الموظفين فقط','#1E40AF', '#DBEAFE'],
              ] as const).map(([val, lbl, color, bg]) => (
                <button key={val} onClick={() => { setClearTarget(val); setClearStatus('idle'); setClearMsg('') }} style={{
                  padding: '8px 18px', borderRadius: 99, border: '2px solid',
                  borderColor: clearTarget === val ? color : '#E2E8F0',
                  background: clearTarget === val ? bg : '#F8FAFC',
                  color: clearTarget === val ? color : '#64748B',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>{lbl}</button>
              ))}
            </div>

            {/* Confirm + Execute */}
            {clearStatus === 'idle' && (
              <button onClick={() => setClearStatus('confirming')} style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: '#FEE2E2', color: '#991B1B',
                fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>
                🗑️ بدء الحذف...
              </button>
            )}

            {clearStatus === 'confirming' && (
              <div style={{ background: '#FFF7ED', border: '1px solid #FCD34D', borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700, color: '#92400E', marginBottom: 12, fontSize: 14 }}>
                  ⚠️ هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleClear} style={{
                    padding: '10px 24px', borderRadius: 10, border: 'none',
                    background: '#EF4444', color: '#fff',
                    fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  }}>
                    نعم، احذف الآن
                  </button>
                  <button onClick={() => setClearStatus('idle')} style={{
                    padding: '10px 24px', borderRadius: 10, border: '2px solid #E2E8F0',
                    background: '#fff', color: '#64748B',
                    fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}>
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {clearStatus === 'clearing' && (
              <div style={{ color: '#6366F1', fontWeight: 600, fontSize: 14 }}>
                ⏳ جارٍ الحذف...
              </div>
            )}

            {clearStatus === 'done' && (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>✅</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#15803D' }}>{clearMsg}</div>
                  <button onClick={() => setClearStatus('idle')} style={{
                    marginTop: 8, padding: '6px 16px', borderRadius: 8, border: 'none',
                    background: '#DCFCE7', color: '#15803D',
                    fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>حسناً</button>
                </div>
              </div>
            )}

            {clearStatus === 'error' && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '14px 18px', color: '#991B1B', fontSize: 13 }}>
                ❌ {clearMsg}
                <button onClick={() => setClearStatus('idle')} style={{
                  marginRight: 12, padding: '4px 12px', borderRadius: 6, border: 'none',
                  background: '#FEE2E2', color: '#991B1B',
                  fontFamily: 'inherit', fontSize: 12, cursor: 'pointer',
                }}>إعادة المحاولة</button>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  )
}

function toAr(n: number | string) {
  return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d])
}
