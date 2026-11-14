// Màn "Bạn học ở đâu?" (003 US1): chọn trường (tìm theo tên / viết tắt, không dấu), bậc (Đại học / Thạc sĩ /
// Tiến sĩ), ngành (chương trình của trường trước, danh mục quốc gia sau); MSSV / lớp / SĐT tuỳ chọn để điền sẵn form.

import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Button, Display, Muted, T } from '@/components/ui';
import { BRAND, FONT, SCREEN_PAD, usePalette } from '@/constants/theme';
import { api } from '@/lib/api';
import { type Catalog, type DegreeLevel, LEVEL_LABEL, type Major, majorsFor, type School, searchSchools } from '@/lib/catalog';

const LEVELS: DegreeLevel[] = ['dai_hoc', 'thac_si', 'tien_si'];

export default function ProfileScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const [cat, setCat] = useState<Catalog | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [schoolQ, setSchoolQ] = useState('');
  const [school, setSchool] = useState<{ name: string; abbr: string } | null>(null);
  const [level, setLevel] = useState<DegreeLevel>('dai_hoc');
  const [majorQ, setMajorQ] = useState('');
  const [major, setMajor] = useState<Major | null>(null);
  const [studentId, setStudentId] = useState('');
  const [className, setClassName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.catalog().then(setCat).catch((e: Error) => setLoadErr(e.message));
    api
      .profile()
      .then((p) => {
        if (p.school_name) setSchool({ name: p.school_name, abbr: p.school_abbr });
        if (p.degree_level) setLevel(p.degree_level);
        if (p.major_name) setMajor({ code: p.major_code, name: p.major_name });
        setStudentId(p.student_id);
        setClassName(p.class_name);
        setPhone(p.phone);
      })
      .catch(() => {});
  }, []);

  const schoolHits = useMemo(() => (cat && !school ? searchSchools(cat.schools, schoolQ, 8) : []), [cat, school, schoolQ]);
  const majorHits = useMemo(
    () => (cat && !major ? majorsFor(cat, school?.abbr ?? '', level, majorQ, 30) : { own: [], national: [] }),
    [cat, major, school, level, majorQ],
  );

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  async function save() {
    if (!school || !major) return;
    setBusy(true);
    setErr(null);
    try {
      await api.saveProfile({
        school_name: school.name,
        school_abbr: school.abbr,
        degree_level: level,
        major_code: major.code,
        major_name: major.name,
        student_id: studentId.trim(),
        class_name: className.trim(),
        phone: phone.trim(),
      });
      close();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function later() {
    await api.snoozeProfile().catch(() => {});
    close();
  }

  const input = [styles.input, { color: c.text, backgroundColor: c.soft, fontFamily: FONT.regular }];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BRAND.cobalt }} behavior="padding">
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Display size={30}>Bạn học ở đâu?</Display>
        <T v="small" color="#FFFFFF">
          Để MStudent biết sự kiện nào có ích cho ngành của bạn và điền sẵn form đăng ký.
        </T>
      </View>
      <ScrollView
        style={[styles.sheet, { backgroundColor: c.surface }]}
        contentContainerStyle={{ padding: SCREEN_PAD, paddingTop: 22, paddingBottom: insets.bottom + 28, gap: 12 }}
        keyboardShouldPersistTaps="handled">
        {loadErr && <T v="small" color={c.bad}>Chưa tải được danh sách trường: {loadErr}</T>}

        <T v="label" color={c.muted}>
          TRƯỜNG
        </T>
        {school ? (
          <Picked label={school.name} sub={school.abbr} onClear={() => { setSchool(null); setMajor(null); }} />
        ) : (
          <>
            <TextInput
              value={schoolQ}
              onChangeText={setSchoolQ}
              placeholder="Gõ tên hoặc viết tắt: HUST, VJU, NEU…"
              placeholderTextColor={c.muted}
              autoCorrect={false}
              style={input}
              accessibilityLabel="Tìm trường"
            />
            {schoolHits.map((s: School) => (
              <Option key={`${s.abbr}-${s.name}`} label={s.name} sub={s.abbr || s.group} onPress={() => setSchool({ name: s.name, abbr: s.abbr })} />
            ))}
            {schoolQ.trim().length >= 3 && (
              <Option label={`Dùng tên "${schoolQ.trim()}"`} sub="Không có trong danh sách" onPress={() => setSchool({ name: schoolQ.trim(), abbr: '' })} />
            )}
          </>
        )}

        <T v="label" color={c.muted} style={{ marginTop: 6 }}>
          BẬC HỌC
        </T>
        <View style={styles.levels} accessibilityRole="radiogroup">
          {LEVELS.map((lv) => {
            const on = lv === level;
            return (
              <Pressable
                key={lv}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => {
                  setLevel(lv);
                  setMajor(null);
                }}
                style={[styles.level, { backgroundColor: on ? BRAND.lime : c.soft }]}>
                <T style={{ fontFamily: on ? FONT.semibold : FONT.medium, fontSize: 15 }} color={on ? BRAND.ink : c.text}>
                  {LEVEL_LABEL[lv]}
                </T>
              </Pressable>
            );
          })}
        </View>

        <T v="label" color={c.muted} style={{ marginTop: 6 }}>
          NGÀNH
        </T>
        {major ? (
          <Picked label={major.name} sub={major.code} onClear={() => setMajor(null)} />
        ) : (
          <>
            <TextInput
              value={majorQ}
              onChangeText={setMajorQ}
              placeholder="Gõ tên hoặc mã ngành"
              placeholderTextColor={c.muted}
              autoCorrect={false}
              style={input}
              accessibilityLabel="Tìm ngành"
            />
            {majorHits.own.length > 0 && <Muted>Chương trình của {school?.abbr || 'trường'}</Muted>}
            {majorHits.own.map((m) => (
              <Option key={`own-${m.code}-${m.name}`} label={m.name} sub={m.code} tone={BRAND.mint} onPress={() => setMajor(m)} />
            ))}
            {majorHits.national.length > 0 && <Muted>Danh mục ngành {LEVEL_LABEL[level].toLowerCase()} (Thông tư 09/2022)</Muted>}
            {majorHits.national.slice(0, majorQ ? 30 : 8).map((m) => (
              <Option key={`n-${m.code}`} label={m.name} sub={m.code} onPress={() => setMajor(m)} />
            ))}
            {majorQ.trim().length >= 3 && (
              <Option label={`Dùng tên "${majorQ.trim()}"`} sub="Không có trong danh sách" onPress={() => setMajor({ code: '', name: majorQ.trim() })} />
            )}
          </>
        )}

        <T v="label" color={c.muted} style={{ marginTop: 6 }}>
          ĐỂ ĐIỀN SẴN FORM (TUỲ CHỌN)
        </T>
        <TextInput value={studentId} onChangeText={setStudentId} placeholder="Mã sinh viên" placeholderTextColor={c.muted} style={input} maxLength={40} autoCapitalize="characters" />
        <TextInput value={className} onChangeText={setClassName} placeholder="Lớp" placeholderTextColor={c.muted} style={input} maxLength={60} />
        <TextInput value={phone} onChangeText={setPhone} placeholder="Số điện thoại" placeholderTextColor={c.muted} style={input} maxLength={20} keyboardType="phone-pad" />
        <Muted>Chỉ dùng để điền sẵn form đăng ký sự kiện trên máy bạn; bạn luôn tự xem lại và tự bấm Gửi.</Muted>

        {err && <T v="small" color={c.bad}>{err}</T>}
        <Button label="Lưu" busy={busy} disabled={!school || !major} onPress={save} />
        <Button variant="outline" label="Để sau" onPress={later} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Option({ label, sub, tone, onPress }: { label: string; sub?: string; tone?: string; onPress: () => void }) {
  const c = usePalette();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.option, { backgroundColor: tone ?? c.soft, opacity: pressed ? 0.6 : 1 }]}>
      <T style={{ fontSize: 15, flex: 1 }} color={tone ? BRAND.ink : c.text} numberOfLines={2}>
        {label}
      </T>
      {!!sub && (
        <T style={{ fontSize: 12, fontFamily: FONT.semibold }} color={tone ? BRAND.ink : c.muted}>
          {sub}
        </T>
      )}
    </Pressable>
  );
}

function Picked({ label, sub, onClear }: { label: string; sub?: string; onClear: () => void }) {
  return (
    <View style={[styles.option, { backgroundColor: BRAND.lime }]}>
      <View style={{ flex: 1 }}>
        <T style={{ fontFamily: FONT.semibold, fontSize: 15 }} color={BRAND.ink}>
          {label}
        </T>
        {!!sub && (
          <T style={{ fontSize: 12 }} color={BRAND.ink}>
            {sub}
          </T>
        )}
      </View>
      <Pressable onPress={onClear} accessibilityRole="button" accessibilityLabel="Chọn lại" hitSlop={10} style={styles.clear}>
        <Icon name="close" color={BRAND.ink} size={18} stroke={2.4} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: SCREEN_PAD, paddingBottom: 18, gap: 6 },
  sheet: { flex: 1, borderTopLeftRadius: 36, borderTopRightRadius: 36 },
  input: { height: 50, borderRadius: 16, paddingHorizontal: 16, fontSize: 15 },
  levels: { flexDirection: 'row', gap: 8 },
  level: { flex: 1, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  clear: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
